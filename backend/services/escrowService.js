const mongoose = require('mongoose')
const { nanoid } = require('nanoid')
const User = require('../models/User')
const { PAYMENT_STATUS, ESCROW_PENDING_STATES } = require('../constants/paymentStatus')
const walletService = require('./walletService')
const { notify, notifyAdmins } = require('../utils/helpers')

const ADMIN_SHARE = 0.15

const getEscrowAdmin = async (session = null) => {
  const escrowAdminId = process.env.ESCROW_SYSTEM_USER_ID
  if (!escrowAdminId) {
    throw Object.assign(new Error('Missing ESCROW_SYSTEM_USER_ID environment variable.'), { statusCode: 500 })
  }

  const admin = await User.findById(escrowAdminId).session(session)
  if (!admin || !admin.is_active) {
    throw Object.assign(new Error('No active escrow system user is available.'), { statusCode: 500 })
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

const secureEscrowPayment = async ({ job, customerId, providerId, amount, referencePrefix, label, session = null, io = null }) => {
  if (!ESCROW_PENDING_STATES.includes(job.payment_status)) {
    if (job.payment_status === PAYMENT_STATUS.PAYOUT_RELEASED || job.payment_status === PAYMENT_STATUS.PAYMENT_RECEIVED) {
      throw Object.assign(new Error('This job has already been paid or is already secured.'), { statusCode: 400 })
    }
    throw Object.assign(new Error('Payment has already been secured for this job.'), { statusCode: 400 })
  }

  if (!providerId) {
    throw Object.assign(new Error('A provider must be assigned before payment can be secured.'), { statusCode: 400 })
  }

  const { amountNumber, adminFee, providerAmount } = getEscrowBreakdown(amount)
  const reference = `${referencePrefix}-${nanoid(8)}`
  const admin = await getEscrowAdmin(session)

  const escrowSession = session || await mongoose.startSession()
  let createdSession = false

  try {
    if (!session) {
      escrowSession.startTransaction()
      createdSession = true
    }

    await walletService.reserveFunds(
      customerId,
      amountNumber,
      `${label} escrow payment`,
      reference,
      { escrow: true, stage: 'held', customer: customerId, provider: providerId, job: job._id },
      'completed',
      escrowSession,
    )

    await walletService.adjustWallet({
      user: admin._id,
      balanceDelta: 0,
      lockedDelta: amountNumber,
      type: 'transfer',
      amount: amountNumber,
      description: `${label} escrow secured`,
      reference: `${reference}-escrow`,
      status: 'completed',
      metadata: { escrow: true, stage: 'held', customer: customerId, provider: providerId, job: job._id },
      session: escrowSession,
    })

    job.payment_status = PAYMENT_STATUS.PAYMENT_RECEIVED
    job.payment_amount = amountNumber
    job.admin_fee = adminFee
    job.provider_amount = providerAmount
    job.paid_at = new Date()
    job.payment_reference = reference
    job.escrow_admin = admin._id
    await job.save({ session: escrowSession })

    if (createdSession) {
      await escrowSession.commitTransaction()
    }
  } catch (error) {
    if (createdSession) {
      await escrowSession.abortTransaction()
    }
    throw error
  } finally {
    if (createdSession) escrowSession.endSession()
  }

  if (io) {
    io.to(`wallet-${customerId}`).emit('wallet-updated', {
      user: customerId,
      balance: (await walletService.getWallet(customerId)).balance,
      locked: (await walletService.getWallet(customerId)).locked,
      reference,
      type: 'escrow_hold',
      timestamp: new Date().toISOString(),
    })
  }

  await notify(providerId, {
    type: 'payment',
    title: 'Payment secured',
    message: `KSh ${amountNumber.toLocaleString()} is secured in escrow for "${label}".`,
    data: { reference, amount: amountNumber, payment_status: PAYMENT_STATUS.PAYMENT_RECEIVED },
  })

  await notify(customerId, {
    type: 'payment',
    title: 'Escrow payment received',
    message: `KSh ${amountNumber.toLocaleString()} is now held securely until the service is completed.`,
    data: { reference, amount: amountNumber, payment_status: PAYMENT_STATUS.PAYMENT_RECEIVED },
  })

  await notifyAdmins({
    type: 'payment',
    title: 'Escrow payment secured',
    message: `${label} payment of KSh ${amountNumber.toLocaleString()} is now held in escrow.`,
    data: { reference, amount: amountNumber, payment_status: PAYMENT_STATUS.PAYMENT_RECEIVED },
  })

  return { amount: amountNumber, adminFee, providerAmount, reference }
}

const releaseEscrowPayment = async ({ job, providerId, label, session = null, io = null }) => {
  if (job.payment_status === PAYMENT_STATUS.PAYOUT_RELEASED || job.payment_status === PAYMENT_STATUS.PAID) {
    throw Object.assign(new Error('This payout has already been released.'), { statusCode: 400 })
  }
  if (job.payment_status !== PAYMENT_STATUS.PAYOUT_PENDING) {
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

  const escrowSession = session || await mongoose.startSession()
  let createdSession = false

  try {
    if (!session) {
      escrowSession.startTransaction()
      createdSession = true
    }

    await walletService.adjustWallet({
      user: job.escrow_admin,
      balanceDelta: 0,
      lockedDelta: -amountNumber,
      type: 'transfer',
      amount: amountNumber,
      description: `${label} escrow released`,
      reference: `${reference}-release`,
      status: 'completed',
      metadata: { escrow: true, stage: 'released', provider: providerId, job: job._id },
      session: escrowSession,
    })

    if (adminFee > 0) {
      await walletService.creditWallet(
        job.escrow_admin,
        adminFee,
        `${label} commission`,
        `${reference}-admin`,
        { commission: true, job: job._id },
        escrowSession,
      )
    }

    if (providerAmount > 0) {
      await walletService.creditWallet(
        providerId,
        providerAmount,
        `${label} payout`,
        `${reference}-provider`,
        { payout: true, job: job._id },
        escrowSession,
      )
    }

    job.payment_status = PAYMENT_STATUS.PAYOUT_RELEASED
    job.payout_released_at = new Date()
    await job.save({ session: escrowSession })

    if (createdSession) {
      await escrowSession.commitTransaction()
    }
  } catch (error) {
    if (createdSession) {
      await escrowSession.abortTransaction()
    }
    throw error
  } finally {
    if (createdSession) escrowSession.endSession()
  }

  if (io) {
    io.to(`wallet-${providerId}`).emit('wallet-updated', {
      user: providerId,
      balance: (await walletService.getWallet(providerId)).balance,
      locked: (await walletService.getWallet(providerId)).locked,
      reference: `${reference}-provider`,
      type: 'payout_release',
      timestamp: new Date().toISOString(),
    })
    io.to(`wallet-${job.escrow_admin}`).emit('wallet-updated', {
      user: job.escrow_admin,
      balance: (await walletService.getWallet(job.escrow_admin)).balance,
      locked: (await walletService.getWallet(job.escrow_admin)).locked,
      reference: `${reference}-admin`,
      type: 'commission',
      timestamp: new Date().toISOString(),
    })
  }

  await notify(providerId, {
    type: 'payment',
    title: 'Payout released',
    message: `KSh ${providerAmount.toLocaleString()} has been released to your wallet for "${label}".`,
    data: { reference, amount: providerAmount, payment_status: PAYMENT_STATUS.PAYOUT_RELEASED },
  })

  await notify(job.customer, {
    type: 'payment',
    title: 'Provider paid',
    message: `The escrow for "${label}" has been released successfully.`,
    data: { reference, amount: amountNumber, payment_status: PAYMENT_STATUS.PAYOUT_RELEASED },
  })

  await notifyAdmins({
    type: 'payment',
    title: 'Escrow released',
    message: `${label} payout released. Commission retained: KSh ${adminFee.toLocaleString()}.`,
    data: { reference, amount: adminFee, payment_status: PAYMENT_STATUS.PAYOUT_RELEASED },
  })

  return { amount: amountNumber, adminFee, providerAmount, reference }
}

module.exports = {
  getEscrowAdmin,
  secureEscrowPayment,
  releaseEscrowPayment,
  ESCROW_PENDING_STATES,
}
