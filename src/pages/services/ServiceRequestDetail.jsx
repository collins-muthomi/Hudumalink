import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { requestsAPI, reviewsAPI, walletAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const statusColor = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completion_requested: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

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

export default function ServiceRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    requestsAPI.detail(id)
      .then((response) => setRequest(response.data))
      .catch(() => toast.error('Not found', 'Could not load this request.'))
      .finally(() => setLoading(false))
  }, [id, toast])

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      const response = await requestsAPI.updateStatus(id, { status })
      setRequest(response.data)
      toast.success('Status updated', `Request marked ${status.replace('_', ' ')}.`)
    } catch (error) {
      toast.error('Update failed', error.response?.data?.detail || 'Could not update the request.')
    } finally {
      setUpdating(false)
    }
  }

  const confirmCompletionWithReview = async () => {
    if (!review.comment.trim()) {
      toast.error('Review required', 'Please leave a short review before confirming completion.')
      return
    }

    setUpdating(true)
    try {
      const response = await requestsAPI.updateStatus(id, { status: 'completed' })
      await reviewsAPI.create({
        provider: request.assignedProvider?._id || request.assignedProvider,
        target_type: 'provider',
        target_id: request.assignedProvider?._id || request.assignedProvider,
        rating: Number(review.rating),
        comment: review.comment.trim(),
      })
      setRequest(response.data)
      setShowCompleteModal(false)
      toast.success('Completion confirmed', 'Your review was saved and payment is now unlocked.')
    } catch (error) {
      toast.error('Update failed', error.response?.data?.detail || 'Could not update the request.')
    } finally {
      setUpdating(false)
    }
  }

  const payForJob = async () => {
    setPaying(true)
    try {
      await walletAPI.payCustomerRequest(id)
      const response = await requestsAPI.detail(id)
      setRequest(response.data)
      toast.success('Payment secured', 'Funds are now held safely in escrow until the service is completed.')
    } catch (error) {
      toast.error('Payment failed', error.response?.data?.detail || 'Could not complete payment.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {Array(5).fill(0).map((_, index) => <div key={index} className="skeleton h-6 rounded-xl" />)}
      </div>
    )
  }

  if (!request) {
    return <div className="p-6 text-center text-slate-400">Request not found.</div>
  }

  const paymentMeta = paymentStatusMeta[request.payment_status] || { label: request.payment_status || 'Pending payment', tone: 'text-slate-700' }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900">{request.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{request.category_name || request.category}</p>
          </div>
          <span className={`badge border capitalize ${statusColor[request.status] || 'bg-slate-100 text-slate-600'}`}>
            {request.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Location</p>
            <p className="font-medium text-slate-700">{request.location}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Budget</p>
            <p className="font-semibold text-primary-700">
              {request.budget ? `KSh ${Number(request.budget).toLocaleString()}` : 'Flexible'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Posted</p>
            <p className="font-medium text-slate-700">{new Date(request.createdAt || request.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Assigned Provider</p>
            {request.assignedProvider || request.assigned_provider_name ? (
              <Link to={`/providers/${request.assignedProvider?._id || request.assignedProvider || ''}`} className="font-medium text-primary-700 hover:underline">
                {request.assigned_provider_name || 'View provider'}
              </Link>
            ) : (
              <p className="font-medium text-slate-700">Waiting for a provider</p>
            )}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-0.5">Payment</p>
            <p className={`font-medium ${paymentMeta.tone}`}>{paymentMeta.label}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-xs font-medium mb-1.5">Description</p>
          <p className="text-slate-700 text-sm leading-relaxed">{request.description}</p>
        </div>

        {request.status === 'assigned' && ['pending_payment', 'unpaid'].includes(request.payment_status) && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">Secure payment before work starts.</p>
            <p className="mt-1 text-xs text-blue-700">Your payment will be held in escrow and only released after you confirm completion.</p>
          </div>
        )}

        {request.payment_status === 'payment_received' && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-900">Payment secured.</p>
            <p className="mt-1 text-xs text-emerald-700">The provider can now proceed, but funds stay protected until the job is complete.</p>
          </div>
        )}

        {request.status === 'completion_requested' && (
          <div className="flex justify-end">
            <Button onClick={() => setShowCompleteModal(true)} loading={updating}>
              Confirm Completion
            </Button>
          </div>
        )}

        {request.status === 'assigned' && ['pending_payment', 'unpaid'].includes(request.payment_status) && (
          <div className="flex justify-end">
            <Button onClick={payForJob} loading={paying}>
              Secure Payment
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete And Review"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)} disabled={updating}>Cancel</Button>
            <Button onClick={confirmCompletionWithReview} loading={updating}>Confirm Completion</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Confirm the work is done, rate the provider, and payment will unlock after this step.</p>
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
    </div>
  )
}
