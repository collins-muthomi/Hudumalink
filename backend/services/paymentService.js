const mongoose = require('mongoose')
const { nanoid } = require('nanoid')
const { stkPush, b2cTransfer } = require('../utils/mpesa')
const walletService = require('./walletService')
const { notify } = require('../utils/helpers')
const { Transaction } = require('../models/index')
const { PAYMENT_STATUS } = require('../constants/paymentStatus')

const createTopupTransaction = async ({ userId, amount, phone, reference, checkoutId }) => {
  return Transaction.create({
    user: userId,
    type: 'credit',
    amount: Number(amount),
    description: 'Wallet top-up via M-Pesa',
    reference,
    status: 'pending',
    metadata: { checkout_id: checkoutId, phone },
  })
}

const requestTopup = async ({ userId, amount, phone }) => {
  const ref = `HL-TOP-${nanoid(8)}`
  const mpesaRes = await stkPush({
    phone,
    amount: Number(amount),
    accountRef: ref,
    description: 'HudumaLink Wallet Top-up',
  })

  await createTopupTransaction({
    userId,
    amount,
    phone,
    reference: ref,
    checkoutId: mpesaRes.CheckoutRequestID,
  })

  return {
    detail: 'STK push sent. Complete payment on your phone.',
    checkout_id: mpesaRes.CheckoutRequestID,
    reference: ref,
  }
}

const processTopupCallback = async ({ body, io }) => {
  const result = body?.Body?.stkCallback
  if (!result) return

  const checkoutId = result.CheckoutRequestID
  const pending = await Transaction.findOneAndUpdate(
    { 'metadata.checkout_id': checkoutId, status: 'pending' },
    {
      status: 'processing',
      'metadata.callback_received_at': new Date(),
      'metadata.stk_response': result,
    },
    { new: true }
  )

  if (!pending) return

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (result.ResultCode === 0) {
      const receipt = (result.CallbackMetadata?.Item || []).find((item) => item.Name === 'MpesaReceiptNumber')?.Value || null
      await walletService.creditWallet(
        pending.user,
        pending.amount,
        'Wallet top-up confirmed',
        `${pending.reference}-confirmed`,
        { checkout_id: checkoutId, receipt },
        session,
      )

      pending.status = 'completed'
      pending.mpesa_receipt = receipt
      await pending.save({ session })
    } else {
      pending.status = 'failed'
      await pending.save({ session })
    }

    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }

  if (result.ResultCode === 0) {
    const updatedWallet = await walletService.getWallet(pending.user)
    if (io) {
      io.to(`wallet-${pending.user}`).emit('wallet-updated', {
        balance: updatedWallet.balance,
        locked: updatedWallet.locked,
        amount: pending.amount,
        reference: pending.reference,
        timestamp: new Date().toISOString(),
      })
    }

    await notify(pending.user, {
      type: 'payment',
      title: 'Wallet topped up ✅',
      message: `KSh ${pending.amount.toLocaleString()} added to your wallet.`,
    })
  }
}

const requestWithdrawal = async ({ userId, amount, phone, io }) => {
  const ref = `HL-WDR-${nanoid(8)}`
  const withdrawalSession = await mongoose.startSession()
  withdrawalSession.startTransaction()

  try {
    await walletService.reserveFunds(
      userId,
      amount,
      `Withdrawal to ${phone}`,
      ref,
      { phone, withdrawal: true, stage: 'requested' },
      withdrawalSession,
    )

    const mpesaRes = await b2cTransfer({ phone, amount, remarks: `HudumaLink withdrawal ${ref}` })
    const pendingTx = await Transaction.findOneAndUpdate(
      { reference: ref },
      { 'metadata.mpesa_request': mpesaRes, 'metadata.b2c_request_id': mpesaRes.ConversationID || null },
      { new: true, session: withdrawalSession }
    )

    await withdrawalSession.commitTransaction()
    withdrawalSession.endSession()

    return {
      detail: `KSh ${Number(amount).toLocaleString()} withdrawal initiated. Funds will arrive shortly if the transfer succeeds.`,
      reference: ref,
      mpesa_response: mpesaRes,
      transaction: pendingTx,
    }
  } catch (error) {
    await withdrawalSession.abortTransaction()
    withdrawalSession.endSession()
    throw error
  }
}

const processWithdrawalResult = async ({ body, io }) => {
  const result = body?.Result || body?.Body || body
  if (!result) return

  const callbackEndpoint = body?.Result || body?.Body ? body : null
  const requestId = result.ConversationID || result.TransactionID || null
  if (!requestId) return

  const pending = await Transaction.findOneAndUpdate(
    { 'metadata.b2c_request_id': requestId, status: 'pending' },
    { status: 'processing', 'metadata.callback_received_at': new Date(), 'metadata.b2c_response': result },
    { new: true }
  )
  if (!pending) return

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const isSuccess = result.ResultCode === 0 || result.ResultCode === '0'
    if (isSuccess) {
      await walletService.releaseLockedFunds(
        pending.user,
        pending.amount,
        `Withdrawal completed to ${pending.metadata.phone || 'M-Pesa'}`,
        `${pending.reference}-completed`,
        { withdrawal: true, stage: 'completed', phone: pending.metadata.phone },
        session,
      )
      pending.status = 'completed'
    } else {
      await walletService.restoreLockedFunds(
        pending.user,
        pending.amount,
        `Withdrawal failed to ${pending.metadata.phone || 'M-Pesa'}`,
        `${pending.reference}-restored`,
        { withdrawal: true, stage: 'failed', phone: pending.metadata.phone },
        session,
      )
      pending.status = 'failed'
    }

    await pending.save({ session })
    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }

  if (io) {
    const updatedWallet = await walletService.getWallet(pending.user)
    io.to(`wallet-${pending.user}`).emit('wallet-updated', {
      balance: updatedWallet.balance,
      locked: updatedWallet.locked,
      amount: pending.amount,
      reference: pending.reference,
      timestamp: new Date().toISOString(),
    })
  }
}

module.exports = {
  requestTopup,
  processTopupCallback,
  requestWithdrawal,
  processWithdrawalResult,
}
