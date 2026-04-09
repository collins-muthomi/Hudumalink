import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'

export default function ServiceRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    servicesAPI.requestDetail(id)
      .then(r => setRequest(r.data))
      .catch(() => toast.error('Not found', 'Could not load this request.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await servicesAPI.cancelRequest(id)
      setRequest(p => ({ ...p, status: 'cancelled' }))
      toast.success('Request cancelled')
      setShowCancel(false)
    } catch { toast.error('Failed', 'Could not cancel request.') }
    finally { setCancelling(false) }
  }

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }

  if (loading) return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-6 rounded-xl" />)}
    </div>
  )
  if (!request) return (
    <div className="p-6 text-center"><p className="text-slate-400">Request not found.</p></div>
  )

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
          <h1 className="font-display font-bold text-xl text-slate-900 flex-1">{request.title}</h1>
          <span className={`badge border ${statusColor[request.status] || 'bg-slate-100 text-slate-600'} capitalize flex-shrink-0`}>{request.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs font-medium mb-0.5">Category</p><p className="font-medium text-slate-700">{request.category_name || request.category}</p></div>
          <div><p className="text-slate-400 text-xs font-medium mb-0.5">Location</p><p className="font-medium text-slate-700">{request.location}</p></div>
          <div><p className="text-slate-400 text-xs font-medium mb-0.5">Urgency</p><p className="font-medium text-slate-700 capitalize">{request.urgency}</p></div>
          <div><p className="text-slate-400 text-xs font-medium mb-0.5">Posted</p><p className="font-medium text-slate-700">{new Date(request.created_at).toLocaleDateString()}</p></div>
          {(request.budget_min || request.budget_max) && (
            <div className="col-span-2">
              <p className="text-slate-400 text-xs font-medium mb-0.5">Budget</p>
              <p className="font-semibold text-primary-700">
                KSh {request.budget_min ? Number(request.budget_min).toLocaleString() : '?'} – {request.budget_max ? Number(request.budget_max).toLocaleString() : '?'}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-slate-400 text-xs font-medium mb-1.5">Description</p>
          <p className="text-slate-700 text-sm leading-relaxed">{request.description}</p>
        </div>

        {/* Responses */}
        {request.responses?.length > 0 && (
          <div>
            <p className="text-slate-700 font-semibold text-sm mb-3">Provider Responses ({request.responses.length})</p>
            <div className="space-y-3">
              {request.responses.map(r => (
                <div key={r.id} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800">{r.provider_name}</p>
                    <p className="text-sm font-bold text-primary-600">KSh {Number(r.quote).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-slate-500">{r.message}</p>
                  {request.status === 'pending' && (
                    <button className="mt-2 text-xs font-medium text-primary-600 hover:underline">Accept Quote</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {request.status === 'pending' && (
          <div className="pt-2 flex justify-end">
            <Button variant="danger" size="sm" onClick={() => setShowCancel(true)}>Cancel Request</Button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Request"
        message="Are you sure you want to cancel this service request? This cannot be undone."
        confirmLabel="Yes, Cancel"
        danger
        loading={cancelling}
      />
    </div>
  )
}
