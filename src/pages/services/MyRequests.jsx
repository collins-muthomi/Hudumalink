import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { requestsAPI, serviceBookingsAPI } from '../../services/api'

const requestStatusColor = {
  open: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completion_requested: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

const bookingStatusColor = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completion_requested: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyRequests() {
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([requestsAPI.my(), serviceBookingsAPI.my()])
      .then(([requestResponse, bookingResponse]) => {
        setRequests(requestResponse.status === 'fulfilled' ? (requestResponse.value.data.results || requestResponse.value.data) : [])
        setBookings(bookingResponse.status === 'fulfilled' ? (bookingResponse.value.data.results || bookingResponse.value.data) : [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">My Service Activity</h1>
          <p className="text-slate-500 text-sm mt-1">Track customer requests, direct bookings, and escrow payment progress in one place.</p>
        </div>
        <Link to="/services/request/new" className="btn-primary text-sm py-2 px-4">+ New Request</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'requests', label: `Customer Requests (${requests.length})` },
          { id: 'bookings', label: `Booked Services (${bookings.length})` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${tab === item.id ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, index) => <div key={index} className="card p-4 skeleton h-20" />)}
        </div>
      ) : tab === 'requests' ? (
        requests.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">?</p>
            <p className="font-semibold text-slate-700">No customer requests yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Post your first request and let verified providers respond</p>
            <Link to="/services/request/new" className="btn-primary text-sm">Post a Request</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Link key={request._id || request.id} to={`/services/request/${request._id || request.id}`} className="card-hover p-5 flex items-start justify-between gap-4 block">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge capitalize ${requestStatusColor[request.status] || 'bg-slate-100 text-slate-600'}`}>
                      {request.status?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{request.category_name || request.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800">{request.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{request.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{new Date(request.createdAt || request.created_at).toLocaleDateString()}</p>
                  {request.assigned_provider_name && <p className="text-xs text-primary-600 mt-1">{request.assigned_provider_name}</p>}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">?</p>
          <p className="font-semibold text-slate-700">No booked services yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Browse provider services and request the one you need</p>
          <Link to="/services" className="btn-primary text-sm">Browse Services</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link key={booking._id || booking.id} to={`/services/bookings/${booking._id || booking.id}`} className="card-hover p-5 flex items-start justify-between gap-4 block">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`badge capitalize ${bookingStatusColor[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                    {booking.status?.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{booking.provider_name}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{booking.service_title || booking.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{booking.description || 'Direct service booking'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400">{new Date(booking.createdAt || booking.created_at).toLocaleDateString()}</p>
                {booking.budget && <p className="text-xs text-primary-600 mt-1">KSh {Number(booking.budget).toLocaleString()}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
