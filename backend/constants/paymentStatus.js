const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_RECEIVED: 'payment_received',
  PAYOUT_PENDING: 'payout_pending',
  PAYOUT_PROCESSING: 'payout_processing',
  PAYOUT_RELEASED: 'payout_released',
  FAILED: 'failed',
})

const ESCROW_PENDING_STATES = [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PENDING_PAYMENT]

module.exports = {
  PAYMENT_STATUS,
  ESCROW_PENDING_STATES,
}
