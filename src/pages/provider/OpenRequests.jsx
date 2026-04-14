import { useEffect, useState } from 'react'
import { requestsAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'

export default function OpenRequests() {
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState(null)

  const load = () => {
    setLoading(true)
    requestsAPI.open()
      .then((response) => setRequests(response.data.results || response.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const acceptRequest = async (id) => {
    setAcceptingId(id)
    try {
      await requestsAPI.accept(id)
      toast.success('Request accepted', 'It has been moved into your jobs.')
      load()
    } catch (error) {
      toast.error('Could not accept request', error.response?.data?.detail || 'Please try again.')
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Open Customer Requests</h1>
        <p className="text-slate-500 text-sm mt-1">These are public requests waiting for a verified provider to take ownership.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(4).fill(0).map((_, index) => <div key={index} className="card p-5 skeleton h-28" />)
        ) : requests.length === 0 ? (
          <div className="card p-10 text-center text-slate-400 text-sm">No open requests right now.</div>
        ) : requests.map((request) => (
          <div key={request._id || request.id} className="card p-5 flex flex-col md:flex-row gap-4 md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge bg-amber-100 text-amber-700">Open</span>
                <span className="text-xs text-slate-400">{request.category_name || request.category}</span>
                <span className="text-xs text-slate-400">{request.location}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mt-2">{request.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{request.description}</p>
              <p className="text-xs text-slate-400 mt-3">
                Posted by {request.customer_name || 'Customer'} on {new Date(request.createdAt || request.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="md:text-right flex-shrink-0">
              <p className="text-sm font-bold text-primary-600">{request.budget ? `KSh ${Number(request.budget).toLocaleString()}` : 'Flexible budget'}</p>
              <Button className="mt-3" onClick={() => acceptRequest(request._id || request.id)} loading={acceptingId === (request._id || request.id)}>
                Accept Request
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
