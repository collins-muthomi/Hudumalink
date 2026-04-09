import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { deliveryAPI, walletAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/contexts'

export default function DeliveryDriverDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState(null)
  const [active, setActive] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  useEffect(() => {
    Promise.allSettled([deliveryAPI.profile(), deliveryAPI.activeDeliveries(), walletAPI.balance()])
      .then(([p, a, b]) => {
        setProfile(p.status === 'fulfilled' ? p.value.data : null)
        setActive(a.status === 'fulfilled' ? a.value.data : [])
        setBalance(b.status === 'fulfilled' ? b.value.data.balance : 0)
      }).finally(() => setLoading(false))
  }, [])

  const handleAccept = async (id) => {
    setAccepting(id)
    try {
      await deliveryAPI.acceptDelivery(id)
      setActive(prev => prev.map(d => d.id === id ? { ...d, status: 'accepted' } : d))
      toast.success('Delivery accepted!', 'Head to the pickup location.')
    } catch {
      toast.error('Failed', 'Could not accept delivery.')
    } finally {
      setAccepting(null)
    }
  }

  const isRegistered = !!profile

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Driver Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Track your deliveries and earnings</p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border ${profile?.is_available ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <span className={`w-2 h-2 rounded-full ${profile?.is_available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {profile?.is_available ? 'Online' : 'Offline'}
        </div>
      </div>

      {!isRegistered && !loading && (
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-teal-50 border-primary-200">
          <p className="font-semibold text-slate-800 mb-1">Complete your driver registration</p>
          <p className="text-sm text-slate-500 mb-4">Upload your documents to start receiving delivery orders.</p>
          <Link to="/delivery/register" className="btn-primary text-sm py-2 px-4 inline-flex">Register Now →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Wallet Balance', value: `KSh ${Number(balance).toLocaleString()}`, icon: '💰', color: 'bg-emerald-50' },
          { label: 'Active Deliveries', value: active.filter(d => d.status === 'accepted').length, icon: '🚴', color: 'bg-blue-50' },
          { label: 'Rating', value: profile?.rating ? `${profile.rating}★` : '—', icon: '⭐', color: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="font-display font-bold text-xl text-slate-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active deliveries */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">Available & Active Deliveries</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="px-5 py-4"><div className="skeleton h-12 w-full rounded" /></div>
          )) : active.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-4xl mb-3">🚴</p>
              <p className="text-sm text-slate-400">No active deliveries right now</p>
              <p className="text-xs text-slate-300 mt-1">New orders will appear here</p>
            </div>
          ) : active.map(d => (
            <div key={d.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">#{d.id}</span>
                  <span className={`badge capitalize ${d.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{d.pickup_address}</p>
                <p className="text-xs text-slate-400 mt-0.5">→ {d.delivery_address}</p>
                <p className="text-xs text-primary-600 font-semibold mt-1">KSh {Number(d.fee || 0).toLocaleString()}</p>
              </div>
              {d.status === 'pending' && (
                <button
                  onClick={() => handleAccept(d.id)}
                  disabled={accepting === d.id}
                  className="btn-primary text-xs py-2 px-3 flex-shrink-0"
                >
                  {accepting === d.id ? 'Accepting…' : 'Accept'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
