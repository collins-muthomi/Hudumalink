import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reviewsAPI, serviceBookingsAPI, walletAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const paymentStatusMeta = {
  unpaid: { label: 'Pending payment', tone: 'text-amber-700' },
  pending_payment: { label: 'Pending payment', tone: 'text-amber-700' },
  payment_received: { label: 'Payment secured', tone: 'text-blue-700' },
  service_in_progress: { label: 'Service in progress', tone: 'text-indigo-700' },
  service_completed: { label: 'Service completed', tone: 'text-emerald-700' },
  payout_pending: { label: 'Payout pending', tone: 'text-violet-700' },
  payout_released: { label: 'Payout released', tone: 'text-emerald-700' },
  paid: { label: 'Payout released', tone: 'text-emerald-700' },
}

export default function ServiceBookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    serviceBookingsAPI.detail(id)
      .then((response) => setBooking(response.data))
      .catch((err) => {
        setBooking(null)
        setError(err.response?.data?.detail || 'Could not load this booking.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const submitReview = async () => {
    setSaving(true)
    try {
      await reviewsAPI.create({
        provider: booking.provider?._id || booking.provider,
        service: booking.service?._id || booking.service,
        target_type: 'provider',
        target_id: booking.provider?._id || booking.provider,
        rating: Number(review.rating),
        comment: review.comment,
      })
      toast.success('Review submitted', 'Thanks for rating the provider.')
      setShowReview(false)
      load()
    } catch (error) {
      toast.error('Review failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const confirmCompletion = async () => {
    if (!review.comment.trim()) {
      toast.error('Review required', 'Please leave a short review before confirming completion.')
      return
    }
    setConfirming(true)
    try {
      await serviceBookingsAPI.updateStatus(id, { status: 'completed' })
      await reviewsAPI.create({
        provider: booking.provider?._id || booking.provider,
        service: booking.service?._id || booking.service,
        target_type: 'provider',
        target_id: booking.provider?._id || booking.provider,
        rating: Number(review.rating),
        comment: review.comment.trim(),
      })
      toast.success('Completion confirmed', 'Payment is now unlocked for this job.')
      setShowCompleteModal(false)
      load()
    } catch (error) {
      toast.error('Could not confirm completion', error.response?.data?.detail || 'Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const payForJob = async () => {
    setPaying(true)
    try {
      await walletAPI.payServiceBooking(id)
      toast.success('Payment secured', 'Funds are now held in escrow until the service is confirmed complete.')
      load()
    } catch (error) {
      toast.error('Payment failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="p-6"><div className="skeleton h-40 rounded-2xl" /></div>
  if (!booking) return <div className="p-6 text-center text-slate-400">{error || 'Booking not found.'}</div>

  const paymentMeta = paymentStatusMeta[booking.payment_status] || { label: booking.payment_status || 'Pending payment', tone: 'text-slate-700' }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900">{booking.service_title || booking.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{booking.provider_name}</p>
          </div>
          <span className="badge capitalize bg-slate-100 text-slate-700">{booking.status?.replace('_', ' ')}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Location</p>
            <p className="font-medium text-slate-700">{booking.location}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Budget</p>
            <p className="font-medium text-slate-700">{booking.budget ? `KSh ${Number(booking.budget).toLocaleString()}` : 'Flexible'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Payment</p>
            <p className={`font-medium ${paymentMeta.tone}`}>{paymentMeta.label}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-xs font-medium mb-1.5">Notes</p>
          <p className="text-sm text-slate-500">{booking.description || 'No extra notes provided.'}</p>
        </div>

        {booking.status === 'accepted' && ['pending_payment', 'unpaid'].includes(booking.payment_status) && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">Secure this booking before the provider starts.</p>
            <p className="mt-1 text-xs text-blue-700">Your payment stays in escrow and is only released after completion is confirmed.</p>
          </div>
        )}

        {booking.payment_status === 'payment_received' && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-900">Payment secured.</p>
            <p className="mt-1 text-xs text-emerald-700">The provider can proceed while your funds remain protected in escrow.</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {booking.status === 'accepted' && ['pending_payment', 'unpaid'].includes(booking.payment_status) && (
            <Button onClick={payForJob} loading={paying}>
              Secure Payment
            </Button>
          )}
          {booking.status === 'completion_requested' && (
            <Button onClick={() => setShowCompleteModal(true)} loading={confirming}>
              Confirm Completion
            </Button>
          )}
          {(booking.payment_status === 'payout_released' || booking.payment_status === 'paid') && !booking.reviewed && (
            <Button onClick={() => setShowReview(true)}>Rate Provider</Button>
          )}
        </div>
      </div>

      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete And Review"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)} disabled={confirming}>Cancel</Button>
            <Button onClick={confirmCompletion} loading={confirming}>Confirm Completion</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Confirm the work is done, then rate and review the provider. The payout will remain pending until release is approved.</p>
          <div>
            <label className="label-base">Rating</label>
            <select value={review.rating} onChange={(event) => setReview((prev) => ({ ...prev, rating: event.target.value }))} className="input-base">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Review</label>
            <textarea
              rows={4}
              className="input-base resize-none"
              value={review.comment}
              onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="How was the provider's work?"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showReview}
        onClose={() => setShowReview(false)}
        title="Rate Provider"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowReview(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submitReview} loading={saving}>Submit Review</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Rating</label>
            <select value={review.rating} onChange={(event) => setReview((prev) => ({ ...prev, rating: event.target.value }))} className="input-base">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Comment</label>
            <textarea rows={4} className="input-base resize-none" value={review.comment} onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
