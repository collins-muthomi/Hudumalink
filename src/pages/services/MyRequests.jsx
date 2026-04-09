import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { servicesAPI } from '../../services/api'

const statusColor = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    servicesAPI.myRequests(params)
      .then(r => setRequests(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filters = ['all', 'pending', 'active', 'completed', 'cancelled']

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">My Service Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your service requests</p>
        </div>
        <Link to="/services/request/new" className="btn-primary text-sm py-2 px-4">+ New Request</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border capitalize transition-all ${filter === f ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card p-4 skeleton h-20" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-semibold text-slate-700">No requests yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Post your first service request and get quotes</p>
          <Link to="/services/request/new" className="btn-primary text-sm">Post a Request</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Link key={r.id} to={`/services/request/${r.id}`} className="card-hover p-5 flex items-start justify-between gap-4 block">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`badge capitalize ${statusColor[r.status] || 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
                  <span className="text-xs text-slate-400">{r.category_name || r.category}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{r.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {r.responses_count != null && (
                  <p className="text-xs text-primary-600 font-medium">{r.responses_count} response{r.responses_count !== 1 ? 's' : ''}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
