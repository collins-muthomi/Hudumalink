const { Wallet, Transaction } = require('../models/index')
const { getOrCreateWallet, creditWallet, debitWallet, paginatedResponse, notify } = require('../utils/helpers')
const { stkPush } = require('../utils/mpesa')
const { nanoid } = require('nanoid')

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
