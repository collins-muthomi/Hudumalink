const { Wallet, Transaction } = require('../models/index')
const { getOrCreateWallet, creditWallet, debitWallet, paginatedResponse, notify, notifyAdmins } = require('../utils/helpers')
const { stkPush } = require('../utils/mpesa')
const { nanoid } = require('nanoid')
const { ServiceBooking } = require('../models/Service')
const CustomerRequest = require('../models/CustomerRequest')

const ADMIN_SHARE = 0.15

const settleJobPayment = async ({ job, customerId, providerId, amount, referencePrefix, label }) => {
  if (job.status !== 'completed') {
    throw Object.assign(new Error('Customer must confirm completion before payment.'), { statusCode: 400 })
  }
  if (job.payment_status === 'paid') {
    throw Object.assign(new Error('This job has already been paid.'), { statusCode: 400 })
  }
  if (!amount || Number(amount) <= 0) {
    throw Object.assign(new Error('A payable amount is required before settlement.'), { statusCode: 400 })
  }

  const amountNumber = Number(amount)
  const adminFee = Math.round(amountNumber * ADMIN_SHARE * 100) / 100
  const providerAmount = Math.round((amountNumber - adminFee) * 100) / 100
  const reference = `${referencePrefix}-${nanoid(8)}`

  await debitWallet(customerId, amountNumber, `${label} payment`, reference)

  const User = require('../models/User')
  const admins = await User.find({ role: 'admin', is_active: true }).select('_id')
  if (!admins.length) {
    throw Object.assign(new Error('No active admin account available for settlement.'), { statusCode: 500 })
  }
  await Promise.all(admins.map((admin, index) => creditWallet(admin._id, adminFee / admins.length, `${label} admin fee`, `${reference}-admin-${index + 1}`)))
  await creditWallet(providerId, providerAmount, `${label} payout`, `${reference}-provider`)

  job.payment_status = 'paid'
  job.payment_amount = amountNumber
  job.admin_fee = adminFee
  job.provider_amount = providerAmount
  job.paid_at = new Date()
  await job.save()

  await notify(providerId, {
    type: 'payment',
    title: 'Job paid',
    message: `You received KSh ${providerAmount.toLocaleString()} after HudumaLink commission.`,
    data: { reference, amount: providerAmount },
  })
  await notify(customerId, {
    type: 'payment',
    title: 'Payment successful',
    message: `KSh ${amountNumber.toLocaleString()} paid. Provider share: KSh ${providerAmount.toLocaleString()}.`,
    data: { reference, amount: amountNumber },
  })
  await notifyAdmins({
    type: 'payment',
    title: 'Marketplace commission received',
    message: `KSh ${adminFee.toLocaleString()} commission collected from ${label.toLowerCase()}.`,
    data: { reference, amount: adminFee },
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

  const settlement = await settleJobPayment({
    job: booking,
    customerId: req.user._id,
    providerId: booking.provider,
    amount: booking.budget,
    referencePrefix: 'HL-SVC',
    label: booking.title || 'Service booking',
  })

  res.json({ detail: 'Payment completed successfully.', ...settlement })
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

  const settlement = await settleJobPayment({
    job: request,
    customerId: req.user._id,
    providerId: request.assignedProvider,
    amount: request.budget,
    referencePrefix: 'HL-REQ',
    label: request.title || 'Customer request',
  })

  res.json({ detail: 'Payment completed successfully.', ...settlement })
}
