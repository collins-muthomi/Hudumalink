import { useEffect, useState } from 'react'
import { requestsAPI, serviceBookingsAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'

const requestNextStatus = {
  assigned: 'in_progress',
  in_progress: 'completion_requested',
}

const bookingNextStatus = {
  pending: 'accepted',
  accepted: 'in_progress',
  in_progress: 'completion_requested',
}

const paymentStatusLabel = {
  pending_payment: 'Awaiting customer payment',
  payment_received: 'Payment secured',
  service_in_progress: 'Service in progress',
  service_completed: 'Ready for payout request',
  payout_pending: 'Payout pending admin release',
  payout_released: 'Payout released',
  unpaid: 'Awaiting customer payment',
  paid: 'Payout released',
}

export default function ProviderJobs() {
  const { toast } = useToast()
  const [customerRequests, setCustomerRequests] = useState([])
  const [serviceJobs, setServiceJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingKey, setUpdatingKey] = useState('')

  const load = () => {
    setLoading(true)
    Promise.allSettled([requestsAPI.my(), serviceBookingsAPI.providerJobs()])
      .then(([requestResponse, bookingResponse]) => {
        setCustomerRequests(requestResponse.status === 'fulfilled' ? (requestResponse.value.data.results || requestResponse.value.data) : [])
        setServiceJobs(bookingResponse.status === 'fulfilled' ? (bookingResponse.value.data.results || bookingResponse.value.data) : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const updateCustomerRequest = async (request, status) => {
    const key = `request-${request._id || request.id}`
    setUpdatingKey(key)
    try {
      await requestsAPI.updateStatus(request._id || request.id, { status })
      toast.success('Request updated', `Marked as ${status.replace('_', ' ')}.`)
      load()
    } catch (error) {
      toast.error('Update failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setUpdatingKey('')
    }
  }

  const updateServiceJob = async (job, status) => {
    const key = `job-${job._id || job.id}`
    setUpdatingKey(key)
    try {
      if (status === 'accepted' && job.status === 'pending') {
        await serviceBookingsAPI.accept(job._id || job.id)
      } else {
        await serviceBookingsAPI.updateStatus(job._id || job.id, { status })
      }
      toast.success('Service updated', `Marked as ${status.replace('_', ' ')}.`)
      load()
    } catch (error) {
      toast.error('Update failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setUpdatingKey('')
    }
  }

  const requestPayout = async (job) => {
    const key = `payout-${job._id || job.id}`
    setUpdatingKey(key)
    try {
      await serviceBookingsAPI.updateStatus(job._id || job.id, { payment_status: 'payout_pending' })
      toast.success('Payout requested', 'Admin can now release the escrowed payment.')
      load()
    } catch (error) {
      toast.error('Payout request failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setUpdatingKey('')
    }
  }

  const requestCustomerPayout = async (request) => {
    const key = `request-payout-${request._id || request.id}`
    setUpdatingKey(key)
    try {
      await requestsAPI.updateStatus(request._id || request.id, { payment_status: 'payout_pending' })
      toast.success('Payout requested', 'Admin can now release the escrowed payment.')
      load()
    } catch (error) {
      toast.error('Payout request failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setUpdatingKey('')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">My Jobs</h1>
        <p className="text-slate-500 text-sm mt-1">Manage accepted customer requests and direct service bookings from one place.</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <section className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Assigned Customer Requests</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, index) => <div key={index} className="px-5 py-4"><div className="skeleton h-5 rounded" /></div>)
            ) : customerRequests.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">No assigned customer requests yet.</div>
            ) : customerRequests.map((request) => (
              <div key={request._id || request.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{request.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{request.customer_name} · {request.location}</p>
                  </div>
                  <span className="badge capitalize bg-blue-100 text-blue-700">{request.status?.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-slate-500">{request.description}</p>
                <p className="text-xs font-medium text-slate-400">{paymentStatusLabel[request.payment_status] || 'Awaiting payment update'}</p>
                {requestNextStatus[request.status] && (
                  <Button size="sm" onClick={() => updateCustomerRequest(request, requestNextStatus[request.status])} loading={updatingKey === `request-${request._id || request.id}`}>
                    Mark {requestNextStatus[request.status].replace('_', ' ')}
                  </Button>
                )}
                {request.status === 'completed' && request.payment_status === 'service_completed' && (
                  <Button size="sm" variant="secondary" onClick={() => requestCustomerPayout(request)} loading={updatingKey === `request-payout-${request._id || request.id}`}>
                    Request Payout
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Direct Service Bookings</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, index) => <div key={index} className="px-5 py-4"><div className="skeleton h-5 rounded" /></div>)
            ) : serviceJobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">No direct service bookings yet.</div>
            ) : serviceJobs.map((job) => (
              <div key={job._id || job.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.service_title || job.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{job.customer_name} · {job.location}</p>
                  </div>
                  <span className="badge capitalize bg-slate-100 text-slate-700">{job.status?.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-slate-500">{job.description || 'No extra notes provided.'}</p>
                <p className="text-xs font-medium text-slate-400">{paymentStatusLabel[job.payment_status] || 'Awaiting payment update'}</p>
                {bookingNextStatus[job.status] && (
                  <Button size="sm" onClick={() => updateServiceJob(job, bookingNextStatus[job.status])} loading={updatingKey === `job-${job._id || job.id}`}>
                    Mark {bookingNextStatus[job.status].replace('_', ' ')}
                  </Button>
                )}
                {job.status === 'completed' && job.payment_status === 'service_completed' && (
                  <Button size="sm" variant="secondary" onClick={() => requestPayout(job)} loading={updatingKey === `payout-${job._id || job.id}`}>
                    Request Payout
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
