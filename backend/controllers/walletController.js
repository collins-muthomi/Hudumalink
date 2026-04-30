const mongoose = require('mongoose')
const { Transaction } = require('../models/index')
const { ServiceBooking } = require('../models/Service')
const CustomerRequest = require('../models/CustomerRequest')
const User = require('../models/User')
const walletService = require('../services/walletService')
const escrowService = require('../services/escrowService')
const paymentService = require('../services/paymentService')
const { notify, notifyAdmins, paginatedResponse } = require('../utils/helpers')
const { PAYMENT_STATUS, ESCROW_PENDING_STATES } = require('../constants/paymentStatus')
const { nanoid } = require('nanoid')

const formatPhone = (phone) => {
  const trimmed = String(phone).trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/^\+/, '').replace(/^0/, '254')
  return /^254\d{9}$/.test(normalized) ? normalized : null
}

const parseAmount = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) {
    throw Object.assign(new Error('Amount must be a positive number.'), { statusCode: 400 })
  }
  return value
}

// GET /api/wallet/balance/
exports.getBalance = async (req, res) => {
  const wallet = await walletService.getOrCreateWallet(req.user._id)
  res.json({ balance: wallet.balance, currency: wallet.currency, locked: wallet.locked })
}

// GET /api/wallet/transactions/
exports.getTransactions = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const data = await paginatedResponse(Transaction, { user: req.user._id }, {
    page,
    limit,
    sort: { createdAt: -1 },
  })
  res.json(data)
}

// POST /api/wallet/topup/
exports.topup = async (req, res) => {
  const { amount, phone } = req.body
  if (!amount || !phone) return res.status(400).json({ detail: 'Amount and phone are required.' })

  const numericAmount = parseAmount(amount)
  if (numericAmount < 10) return res.status(400).json({ detail: 'Minimum top-up is KSh 10.' })

  const formattedPhone = formatPhone(phone)
  if (!formattedPhone) return res.status(400).json({ detail: 'Phone number must be a valid Kenyan phone number.' })

  const ref = `HL-TOP-${nanoid(8)}`

  if (process.env.NODE_ENV === 'development' || process.env.MPESA_ENV === 'sandbox') {
    await walletService.creditWallet(req.user._id, numericAmount, 'Wallet top-up (sandbox)', ref)
    await notify(req.user._id, { type: 'payment', title: 'Wallet topped up ✅', message: `KSh ${numericAmount.toLocaleString()} added to your wallet (sandbox).` })
    return res.json({ detail: 'Wallet topped up (sandbox mode).', balance: (await walletService.getOrCreateWallet(req.user._id)).balance })
  }

  try {
    const payload = await paymentService.requestTopup({ userId: req.user._id, amount: numericAmount, phone: formattedPhone })
    return res.json(payload)
  } catch (err) {
    return res.status(502).json({ detail: 'M-Pesa service unavailable. Please try again.' })
  }
}

// POST /api/wallet/topup/callback — called by M-Pesa
exports.topupCallback = async (req, res) => {
  const result = req.body?.Body?.stkCallback
  if (!result) return res.json({ ResultCode: 0 })

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  setImmediate(async () => {
    try {
      await paymentService.processTopupCallback({ body: req.body, io: req.app.get('io') })
    } catch (err) {
      console.error('Topup callback processing error:', err)
    }
  })
}

// POST /api/wallet/mpesa/b2c/result
exports.withdrawalResultCallback = async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  setImmediate(async () => {
    try {
      await paymentService.processWithdrawalResult({ body: req.body, io: req.app.get('io') })
    } catch (err) {
      console.error('Withdrawal callback processing error:', err)
    }
  })
}

// POST /api/wallet/mpesa/b2c/timeout
exports.withdrawalTimeoutCallback = async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}

// POST /api/wallet/withdraw/
exports.withdraw = async (req, res) => {
  const { amount, phone } = req.body
  if (!amount || !phone) return res.status(400).json({ detail: 'Amount and phone are required.' })

  const numericAmount = parseAmount(amount)
  if (numericAmount < 50) return res.status(400).json({ detail: 'Minimum withdrawal is KSh 50.' })

  const formattedPhone = formatPhone(phone)
  if (!formattedPhone) return res.status(400).json({ detail: 'Phone number must be a valid Kenyan phone number.' })

  const wallet = await walletService.getOrCreateWallet(req.user._id)
  if (wallet.balance < numericAmount) {
    return res.status(400).json({ detail: `Insufficient balance. Your balance is KSh ${wallet.balance.toLocaleString()}.` })
  }

  if (process.env.NODE_ENV === 'development' || process.env.MPESA_ENV === 'sandbox') {
    const ref = `HL-WDR-${nanoid(8)}`
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      await walletService.reserveFunds(req.user._id, numericAmount, `Withdrawal to ${formattedPhone}`, ref, { phone: formattedPhone, withdrawal: true, stage: 'completed' }, session)
      await walletService.releaseLockedFunds(req.user._id, numericAmount, `Withdrawal completed to ${formattedPhone}`, `${ref}-completed`, { phone: formattedPhone, withdrawal: true, stage: 'completed' }, session)
      await session.commitTransaction()
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }

    await notify(req.user._id, {
      type: 'payment',
      title: 'Withdrawal completed',
      message: `KSh ${numericAmount.toLocaleString()} was withdrawn to ${formattedPhone}.`,
    })

    return res.json({ detail: `KSh ${numericAmount.toLocaleString()} withdrawal completed in sandbox mode.`, reference: ref })
  }

  const payload = await paymentService.requestWithdrawal({ userId: req.user._id, amount: numericAmount, phone: formattedPhone })
  await notify(req.user._id, {
    type: 'payment',
    title: 'Withdrawal initiated',
    message: `KSh ${numericAmount.toLocaleString()} withdrawal to ${formattedPhone} is being processed.`,
  })

  res.json(payload)
}

// POST /api/wallet/transfer/
exports.transfer = async (req, res) => {
  const { amount, recipient_phone, note } = req.body
  if (!amount || !recipient_phone) return res.status(400).json({ detail: 'Amount and recipient phone required.' })

  const numericAmount = parseAmount(amount)
  if (numericAmount < 10) return res.status(400).json({ detail: 'Minimum transfer is KSh 10.' })

  const recipient = await User.findOne({ phone: recipient_phone })
  if (!recipient) return res.status(404).json({ detail: 'No HudumaLink user found with that phone number.' })
  if (recipient._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ detail: 'Cannot transfer to yourself.' })
  }

  const ref = `HL-TRF-${nanoid(8)}`
  const transferSession = await mongoose.startSession()
  transferSession.startTransaction()

  try {
    await walletService.transferFunds({
      senderId: req.user._id,
      recipientId: recipient._id,
      amount: numericAmount,
      senderDescription: `Transfer to ${recipient.first_name} ${recipient.last_name}`,
      recipientDescription: `Transfer from ${req.user.first_name} ${req.user.last_name}`,
      reference: ref,
      session: transferSession,
    })
    await transferSession.commitTransaction()
  } catch (err) {
    await transferSession.abortTransaction()
    transferSession.endSession()
    throw err
  }
  transferSession.endSession()

  const updatedSenderWallet = await walletService.getWallet(req.user._id)
  const updatedRecipientWallet = await walletService.getWallet(recipient._id)

  if (req.app.get('io')) {
    req.app.get('io').to(`wallet-${req.user._id}`).emit('wallet-updated', {
      balance: updatedSenderWallet.balance,
      locked: updatedSenderWallet.locked,
      amount: numericAmount,
      reference: ref,
      timestamp: new Date().toISOString(),
    })
    req.app.get('io').to(`wallet-${recipient._id}`).emit('wallet-updated', {
      balance: updatedRecipientWallet.balance,
      locked: updatedRecipientWallet.locked,
      amount: numericAmount,
      reference: `${ref}-in`,
      timestamp: new Date().toISOString(),
    })
  }

  await notify(recipient._id, {
    type: 'payment',
    title: 'Money received 💳',
    message: `${req.user.first_name} sent you KSh ${numericAmount.toLocaleString()}. ${note || ''}`,
  })
  await notify(req.user._id, {
    type: 'payment',
    title: 'Transfer sent',
    message: `KSh ${numericAmount.toLocaleString()} sent to ${recipient.first_name} ${recipient.last_name}.`,
  })

  res.json({ detail: `KSh ${numericAmount.toLocaleString()} transferred successfully.`, reference: ref })
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

  const settlement = await escrowService.secureEscrowPayment({
    job: booking,
    customerId: req.user._id,
    providerId: booking.provider,
    amount: booking.budget,
    referencePrefix: 'HL-SVC',
    label: booking.title || 'Service booking',
    io: req.app.get('io'),
  })

  res.json({ detail: 'Payment secured successfully.', payment_status: PAYMENT_STATUS.PAYMENT_RECEIVED, ...settlement })
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

  const settlement = await escrowService.secureEscrowPayment({
    job: request,
    customerId: req.user._id,
    providerId: request.assignedProvider,
    amount: request.budget,
    referencePrefix: 'HL-REQ',
    label: request.title || 'Customer request',
    io: req.app.get('io'),
  })

  res.json({ detail: 'Payment secured successfully.', payment_status: PAYMENT_STATUS.PAYMENT_RECEIVED, ...settlement })
}

exports.ESCROW_PENDING_STATES = ESCROW_PENDING_STATES
exports.releaseEscrowPayment = escrowService.releaseEscrowPayment
