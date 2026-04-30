const mongoose = require('mongoose')
const { Wallet, Transaction } = require('../models/index')

const WALLET_TRANSACTION_TYPES = ['credit', 'debit', 'transfer', 'refund']

const getOrCreateWallet = async (userId, session = null) => {
  return Wallet.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { balance: 0, locked: 0, currency: 'KES' } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  )
}

const getWallet = async (userId, session = null) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session)
  return wallet || getOrCreateWallet(userId, session)
}

const createTransaction = async ({
  user,
  type,
  amount,
  description,
  reference = null,
  status = 'completed',
  metadata = {},
  session = null,
}) => {
  if (!WALLET_TRANSACTION_TYPES.includes(type)) {
    throw Object.assign(new Error('Invalid wallet transaction type.'), { statusCode: 400 })
  }
  if (amount <= 0) {
    throw Object.assign(new Error('Transaction amount must be greater than zero.'), { statusCode: 400 })
  }

  const transaction = new Transaction({
    user,
    type,
    amount,
    description,
    reference,
    status,
    metadata,
  })

  await transaction.save({ session })
  return transaction
}

const adjustWallet = async ({
  user,
  balanceDelta = 0,
  lockedDelta = 0,
  type,
  amount,
  description,
  reference = null,
  status = 'completed',
  metadata = {},
  session = null,
}) => {
  if (amount <= 0) {
    throw Object.assign(new Error('Amount must be a positive number.'), { statusCode: 400 })
  }
  const update = { $inc: {} }
  if (balanceDelta) update.$inc.balance = balanceDelta
  if (lockedDelta) update.$inc.locked = lockedDelta

  const query = { user }
  if (balanceDelta < 0) query.balance = { $gte: Math.abs(balanceDelta) }
  if (lockedDelta < 0) query.locked = { $gte: Math.abs(lockedDelta) }

  const options = { new: true, session }
  if (balanceDelta >= 0 && lockedDelta >= 0) {
    options.upsert = true
    options.setDefaultsOnInsert = { balance: 0, locked: 0, currency: 'KES' }
  }

  const wallet = await Wallet.findOneAndUpdate(query, update, options)
  if (!wallet) {
    throw Object.assign(new Error('Insufficient wallet funds or wallet not found.'), { statusCode: 400 })
  }
  if (wallet.balance < 0 || wallet.locked < 0) {
    throw Object.assign(new Error('Wallet balance or locked funds cannot go negative.'), { statusCode: 500 })
  }

  await createTransaction({
    user,
    type,
    amount,
    description,
    reference,
    status,
    metadata,
    session,
  })

  return wallet
}

const creditWallet = async (userId, amount, description, reference = null, metadata = {}, session = null) => {
  return adjustWallet({
    user: userId,
    balanceDelta: Number(amount),
    lockedDelta: 0,
    type: 'credit',
    amount: Number(amount),
    description,
    reference,
    status: 'completed',
    metadata,
    session,
  })
}

const debitWallet = async (userId, amount, description, reference = null, metadata = {}, session = null) => {
  return adjustWallet({
    user: userId,
    balanceDelta: -Number(amount),
    lockedDelta: 0,
    type: 'debit',
    amount: Number(amount),
    description,
    reference,
    status: 'completed',
    metadata,
    session,
  })
}

const reserveFunds = async (userId, amount, description, reference = null, metadata = {}, status = 'pending', session = null) => {
  return adjustWallet({
    user: userId,
    balanceDelta: -Number(amount),
    lockedDelta: Number(amount),
    type: 'transfer',
    amount: Number(amount),
    description,
    reference,
    status,
    metadata,
    session,
  })
}

const releaseLockedFunds = async (userId, amount, description, reference = null, metadata = {}, session = null) => {
  return adjustWallet({
    user: userId,
    balanceDelta: 0,
    lockedDelta: -Number(amount),
    type: 'debit',
    amount: Number(amount),
    description,
    reference,
    status: 'completed',
    metadata,
    session,
  })
}

const restoreLockedFunds = async (userId, amount, description, reference = null, metadata = {}, session = null) => {
  return adjustWallet({
    user: userId,
    balanceDelta: Number(amount),
    lockedDelta: -Number(amount),
    type: 'refund',
    amount: Number(amount),
    description,
    reference,
    status: 'completed',
    metadata,
    session,
  })
}

const transferFunds = async ({
  senderId,
  recipientId,
  amount,
  senderDescription,
  recipientDescription,
  reference,
  metadata = {},
  session = null,
}) => {
  if (!senderId || !recipientId) {
    throw Object.assign(new Error('Both sender and recipient are required for transfers.'), { statusCode: 400 })
  }
  if (senderId.toString() === recipientId.toString()) {
    throw Object.assign(new Error('Cannot transfer funds to the same wallet.'), { statusCode: 400 })
  }

  const walletSession = session || await mongoose.startSession()
  let createdSession = false
  try {
    if (!session) {
      walletSession.startTransaction()
      createdSession = true
    }

    await debitWallet(senderId, amount, senderDescription, reference, metadata, walletSession)
    await creditWallet(recipientId, amount, recipientDescription, `${reference}-in`, metadata, walletSession)

    if (createdSession) {
      await walletSession.commitTransaction()
    }
  } catch (error) {
    if (createdSession) {
      await walletSession.abortTransaction()
    }
    throw error
  } finally {
    if (!session) walletSession.endSession()
  }
}

module.exports = {
  getWallet,
  getOrCreateWallet,
  createTransaction,
  creditWallet,
  debitWallet,
  reserveFunds,
  releaseLockedFunds,
  restoreLockedFunds,
  transferFunds,
}
