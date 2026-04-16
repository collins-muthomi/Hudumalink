const { Wallet, Transaction } = require('../models/index')
const { getOrCreateWallet, creditWallet, debitWallet, paginatedResponse, notify, notifyAdmins } = require('../utils/helpers')
const { stkPush } = require('../utils/mpesa')
const { nanoid } = require('nanoid')
const { ServiceBooking } = require('../models/Service')
const CustomerRequest = require('../models/CustomerRequest')
const User = require('../models/User')

const ADMIN_SHARE = 0.15
const ESCROW_PENDING_STATES = ['pending_payment', 'unpaid']

const getEscrowAdmin = async () => {
  const admin = await User.findOne({ role: 'admin', is_active: true }).select('_id')
  if (!admin) {
    throw Object.assign(new Error('No active admin escrow account is available.'), { statusCode: 500 })
  }
  return admin
}

const getEscrowBreakdown = (amount) => {
  const amountNumber = Number(amount)
  if (!amountNumber || amountNumber <= 0) {
    throw Object.assign(new Error('A payable amount is required before settlement.'), { statusCode: 400 })
  }

  const adminFee = Math.round(amountNumber * ADMIN_SHARE * 100) / 100
  const providerAmount = Math.round((amountNumber - adminFee) * 100) / 100
  return { amountNumber, adminFee, providerAmount }
}

const secureEscrowPayment = async ({ job, customerId, providerId, amount, referencePrefix, label }) => {
  if (!ESCROW_PENDING_STATES.includes(job.payment_status)) {
    if (job.payment_status === 'payout_released' || job.payment_status === 'paid') {
      throw Object.assign(new Error('This job has already been paid out.'), { statusCode: 400 })
    }
    throw Object.assign(new Error('Payment has already been secured for this job.'), { statusCode: 400 })
  }
  if (!providerId) {
    throw Object.assign(new Error('A provider must be assigned before payment can be secured.'), { statusCode: 400 })
  }

  const { amountNumber, adminFee, providerAmount } = getEscrowBreakdown(amount)
  const reference = `${referencePrefix}-${nanoid(8)}`
  const admin = await getEscrowAdmin()

  await debitWallet(customerId, amountNumber, `${label} escrow payment`, reference)

  const escrowWallet = await getOrCreateWallet(admin._id)
  escrowWallet.locked += amountNumber
  await escrowWallet.save()

  await Transaction.create({
    user: admin._id,
    type: 'transfer',
    amount: amountNumber,
    description: `${label} escrow secured`,
    reference: `${reference}-escrow`,
    status: 'completed',
    metadata: { escrow: true, stage: 'held', customer: customerId, provider: providerId, job: job._id },
  })

  job.payment_status = 'payment_received'
  job.payment_amount = amountNumber
  job.admin_fee = adminFee
  job.provider_amount = providerAmount
  job.paid_at = new Date()
  job.payment_reference = reference
  job.escrow_admin = admin._id
  await job.save()

  await notify(providerId, {
    type: 'payment',
    title: 'Payment secured',
    message: `KSh ${amountNumber.toLocaleString()} is secured in escrow for "${label}".`,
    data: { reference, amount: amountNumber, payment_status: 'payment_received' },
  })
  await notify(customerId, {
    type: 'payment',
    title: 'Escrow payment received',
    message: `KSh ${amountNumber.toLocaleString()} is now held securely until the service is completed.`,
    data: { reference, amount: amountNumber, payment_status: 'payment_received' },
  })
  await notifyAdmins({
    type: 'payment',
    title: 'Escrow payment secured',
    message: `${label} payment of KSh ${amountNumber.toLocaleString()} is now held in escrow.`,
    data: { reference, amount: amountNumber, payment_status: 'payment_received' },
  })

  return { amount: amountNumber, adminFee, providerAmount, reference }
}

const releaseEscrowPayment = async ({ job, providerId, label }) => {
  if (job.payment_status === 'payout_released' || job.payment_status === 'paid') {
    throw Object.assign(new Error('This payout has already been released.'), { statusCode: 400 })
  }
  if (job.payment_status !== 'payout_pending') {
    throw Object.assign(new Error('The provider must request payout before funds can be released.'), { statusCode: 400 })
  }
  if (job.status !== 'completed') {
    throw Object.assign(new Error('The service must be completed before funds can be released.'), { statusCode: 400 })
  }
  if (!job.escrow_admin) {
    throw Object.assign(new Error('Escrow admin account could not be determined.'), { statusCode: 500 })
  }

  const amountNumber = Number(job.payment_amount || job.budget || 0)
  const adminFee = Number(job.admin_fee || 0)
  const providerAmount = Number(job.provider_amount || 0)
  const reference = job.payment_reference || `HL-ESC-${nanoid(8)}`

  const escrowWallet = await getOrCreateWallet(job.escrow_admin)
  if (escrowWallet.locked < amountNumber) {
    throw Object.assign(new Error('Escrow balance is not sufficient for release.'), { statusCode: 500 })
  }

  escrowWallet.locked -= amountNumber
  await escrowWallet.save()

  await Transaction.create({
    user: job.escrow_admin,
    type: 'transfer',
    amount: amountNumber,
    description: `${label} escrow released`,
    reference: `${reference}-release`,
    status: 'completed',
    metadata: { escrow: true, stage: 'released', provider: providerId, job: job._id },
  })

  if (adminFee > 0) {
    await creditWallet(job.escrow_admin, adminFee, `${label} commission`, `${reference}-admin`)
  }
  if (providerAmount > 0) {
    await creditWallet(providerId, providerAmount, `${label} payout`, `${reference}-provider`)
  }

  job.payment_status = 'payout_released'
  job.payout_released_at = new Date()
  await job.save()

  await notify(providerId, {
    type: 'payment',
    title: 'Payout released',
    message: `KSh ${providerAmount.toLocaleString()} has been released to your wallet for "${label}".`,
    data: { reference, amount: providerAmount, payment_status: 'payout_released' },
  })
  await notify(job.customer, {
    type: 'payment',
    title: 'Provider paid',
    message: `The escrow for "${label}" has been released successfully.`,
    data: { reference, amount: amountNumber, payment_status: 'payout_released' },
  })
  await notifyAdmins({
    type: 'payment',
    title: 'Escrow released',
    message: `${label} payout released. Commission retained: KSh ${adminFee.toLocaleString()}.`,
    data: { reference, amount: adminFee, payment_status: 'payout_released' },
  })

  return { amount: amountNumber, adminFee, providerAmount, reference }
}

// GET /api/wallet/balance/
exports.getBalance = async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id)
  res.json({ balance: wallet.balance, currency: wallet.currency, locked: wallet.locked })
}

// GET /api/wallet/transactions/
exports.getTransactions = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const data = await paginatedResponse(Transaction, { user: req.user._id }, {
    page, limit, sort: { createdAt: -1 },
  })
  res.json(data)
}

// POST /api/wallet/topup/
exports.topup = async (req, res) => {
  const { amount, phone } = req.body
  if (!amount || !phone) return res.status(400).json({ detail: 'Amount and phone are required.' })
  if (Number(amount) < 10) return res.status(400).json({ detail: 'Minimum top-up is KSh 10.' })

  const ref = `HL-TOP-${nanoid(8)}`

  try {
    const mpesaRes = await stkPush({
      phone,
      amount: Number(amount),
      accountRef: ref,
      description: 'HudumaLink Wallet Top-up',
    })

    // Store pending transaction — will be confirmed via callback
    await Transaction.create({
      user: req.user._id,
      type: 'credit',
      amount: Number(amount),
      description: 'Wallet top-up via M-Pesa',
      reference: ref,
      status: 'pending',
      metadata: { checkout_id: mpesaRes.CheckoutRequestID, phone },
    })

    res.json({
      detail: 'STK push sent. Complete payment on your phone.',
      checkout_id: mpesaRes.CheckoutRequestID,
      reference: ref,
    })
  } catch (err) {
    // In sandbox/dev — just credit directly
    if (process.env.NODE_ENV === 'development' || process.env.MPESA_ENV === 'sandbox') {
      await creditWallet(req.user._id, Number(amount), 'Wallet top-up (sandbox)', ref)
      await notify(req.user._id, { type: 'payment', title: 'Wallet topped up ✅', message: `KSh ${Number(amount).toLocaleString()} added to your wallet (sandbox).` })
      return res.json({ detail: 'Wallet topped up (sandbox mode).', balance: (await getOrCreateWallet(req.user._id)).balance })
    }
    return res.status(502).json({ detail: 'M-Pesa service unavailable. Please try again.' })
  }
}

// POST /api/wallet/topup/callback — called by M-Pesa
exports.topupCallback = async (req, res) => {
  try {
    const result = req.body?.Body?.stkCallback
    if (!result) return res.json({ ResultCode: 0 })

    const success = result.ResultCode === 0
    const checkoutId = result.CheckoutRequestID

    const pending = await Transaction.findOne({ 'metadata.checkout_id': checkoutId, status: 'pending' })
    if (pending) {
      if (success) {
        pending.status = 'completed'
        await pending.save()
        await creditWallet(pending.user, pending.amount, pending.description, `${pending.reference}-confirmed`)
        await notify(pending.user, {
          type: 'payment',
          title: 'Wallet topped up ✅',
          message: `KSh ${pending.amount.toLocaleString()} added to your wallet.`,
        })
      } else {
        pending.status = 'failed'
        await pending.save()
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch {
    res.json({ ResultCode: 0 })
  }
}

// POST /api/wallet/withdraw/
exports.withdraw = async (req, res) => {
  const { amount, phone } = req.body
  if (!amount || !phone) return res.status(400).json({ detail: 'Amount and phone are required.' })
  if (Number(amount) < 50) return res.status(400).json({ detail: 'Minimum withdrawal is KSh 50.' })

  const wallet = await getOrCreateWallet(req.user._id)
  if (wallet.balance < Number(amount)) {
    return res.status(400).json({ detail: `Insufficient balance. Your balance is KSh ${wallet.balance.toLocaleString()}.` })
  }

  const ref = `HL-WDR-${nanoid(8)}`

  // Debit immediately, send B2C
  await debitWallet(req.user._id, Number(amount), `Withdrawal to ${phone}`, ref)

  await notify(req.user._id, {
    type: 'payment',
    title: 'Withdrawal initiated',
    message: `KSh ${Number(amount).toLocaleString()} withdrawal to ${phone} is being processed.`,
  })

  res.json({ detail: `KSh ${Number(amount).toLocaleString()} withdrawal initiated. Funds will arrive shortly.`, reference: ref })
}

// POST /api/wallet/transfer/
exports.transfer = async (req, res) => {
  const { amount, recipient_phone, note } = req.body
  if (!amount || !recipient_phone) return res.status(400).json({ detail: 'Amount and recipient phone required.' })
  if (Number(amount) < 10) return res.status(400).json({ detail: 'Minimum transfer is KSh 10.' })

  const User = require('../models/User')
  const recipient = await User.findOne({ phone: recipient_phone })
  if (!recipient) return res.status(404).json({ detail: 'No HudumaLink user found with that phone number.' })
  if (recipient._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ detail: 'Cannot transfer to yourself.' })
  }

  const ref = `HL-TRF-${nanoid(8)}`

  await debitWallet(req.user._id, Number(amount), `Transfer to ${recipient.first_name} ${recipient.last_name}`, ref)
  await creditWallet(recipient._id, Number(amount), `Transfer from ${req.user.first_name} ${req.user.last_name}`, `${ref}-in`)

  await notify(recipient._id, {
    type: 'payment',
    title: 'Money received 💳',
    message: `${req.user.first_name} sent you KSh ${Number(amount).toLocaleString()}. ${note || ''}`,
  })
  await notify(req.user._id, {
    type: 'payment',
    title: 'Transfer sent',
    message: `KSh ${Number(amount).toLocaleString()} sent to ${recipient.first_name} ${recipient.last_name}.`,
  })

  res.json({ detail: `KSh ${Number(amount).toLocaleString()} transferred successfully.`, reference: ref })
}

// POST /api/wallet/service-bookings/:id/pay/
exports.payServiceBooking = async (req, res) => {
  const booking = await ServiceBooking.findById(req.params.id)
  if (!booking) return res.status(404).json({ detail: 'Service booking not found.' })
  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Only the customer can pay for this booking.' })
  }
  if (!['accepted', 'in_progress', 'completion_requested', 'completed'].includes(booking.status)) {
    return res.status(400).json({ detail: 'The provider must accept this booking before payment can be secured.' })
  }

  const settlement = await secureEscrowPayment({
    job: booking,
    customerId: req.user._id,
    providerId: booking.provider,
    amount: booking.budget,
    referencePrefix: 'HL-SVC',
    label: booking.title || 'Service booking',
  })

  res.json({ detail: 'Payment secured successfully.', payment_status: 'payment_received', ...settlement })
}

// POST /api/wallet/requests/:id/pay/
exports.payCustomerRequest = async (req, res) => {
  const request = await CustomerRequest.findById(req.params.id)
  if (!request) return res.status(404).json({ detail: 'Customer request not found.' })
  if (request.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Only the customer can pay for this request.' })
  }
  if (!request.assignedProvider) {
    return res.status(400).json({ detail: 'No provider is assigned to this request.' })
  }
  if (!['assigned', 'in_progress', 'completion_requested', 'completed'].includes(request.status)) {
    return res.status(400).json({ detail: 'A provider must be assigned before payment can be secured.' })
  }

  const settlement = await secureEscrowPayment({
    job: request,
    customerId: req.user._id,
    providerId: request.assignedProvider,
    amount: request.budget,
    referencePrefix: 'HL-REQ',
    label: request.title || 'Customer request',
  })

  res.json({ detail: 'Payment secured successfully.', payment_status: 'payment_received', ...settlement })
}

exports.ESCROW_PENDING_STATES = ESCROW_PENDING_STATES
exports.releaseEscrowPayment = releaseEscrowPayment
