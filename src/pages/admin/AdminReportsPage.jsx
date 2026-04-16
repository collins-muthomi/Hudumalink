import { useEffect, useState } from 'react'
import { adminAPI, requestsAPI, serviceBookingsAPI } from '../../services/api'

const reportTypes = [
  { value: 'service_requests', label: 'Service Requests' },
  { value: 'service_bookings', label: 'Service Bookings' },
]

const paymentStatusLabel = {
  pending_payment: 'Pending payment',
  payment_received: 'Payment secured',
  service_in_progress: 'Service in progress',
  service_completed: 'Service completed',
  payout_pending: 'Payout pending',
  payout_released: 'Payout released',
  unpaid: 'Pending payment',
  paid: 'Payout released',
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('service_requests')
  const [reportData, setReportData] = useState({ count: 0, results: [] })
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [releasingId, setReleasingId] = useState('')

  const load = () => {
    setLoading(true)
    Promise.allSettled([
      adminAPI.reports({ type: reportType }),
      adminAPI.activityLog(),
    ])
      .then(([reportResponse, activityResponse]) => {
        setReportData(reportResponse.status === 'fulfilled' ? reportResponse.value.data : { count: 0, results: [] })
        setActivity(activityResponse.status === 'fulfilled' ? activityResponse.value.data || [] : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [reportType])

  const renderTitle = (item) => {
    if (reportType === 'service_bookings') return item.service?.title || item.title || item._id
    return item.title || item._id
  }

  const renderParty = (item) => {
    if (reportType === 'service_bookings') {
      return item.provider ? `${item.provider.first_name || ''} ${item.provider.last_name || ''}`.trim() : 'Provider'
    }
    return item.assignedProvider ? `${item.assignedProvider.first_name || ''} ${item.assignedProvider.last_name || ''}`.trim() : 'Unassigned'
  }

  const releaseEscrow = async (item) => {
    const itemId = item._id || item.id
    setReleasingId(itemId)
    try {
      if (reportType === 'service_bookings') {
        await serviceBookingsAPI.updateStatus(itemId, { payment_status: 'payout_released' })
      } else {
        await requestsAPI.updateStatus(itemId, { payment_status: 'payout_released' })
      }
      load()
    } finally {
      setReleasingId('')
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Reports</h1>
        <p className="text-sm text-slate-500">Inspect service activity, track escrow states, and release payouts when jobs are ready.</p>
      </div>

      <div className="card flex flex-wrap gap-2 p-4">
        {reportTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setReportType(type.value)}
            className={reportType === type.value ? 'btn-primary' : 'btn-secondary'}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-semibold text-slate-800">Results</h2>
            <span className="badge bg-slate-100 text-slate-700">{reportData.count || 0} records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-5 py-4">
                <div className="skeleton h-16 w-full rounded-xl" />
              </div>
            )) : (reportData.results || []).length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No records found for this report.
              </div>
            ) : (reportData.results || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-900">{renderTitle(item)}</p>
                  <p className="mt-1 text-sm text-slate-500">{renderParty(item)}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{paymentStatusLabel[item.payment_status] || item.status || 'No status'}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{item.budget ? `KSh ${Number(item.budget).toLocaleString()}` : item.payment_amount ? `KSh ${Number(item.payment_amount).toLocaleString()}` : 'Record'}</p>
                  <p>{new Date(item.createdAt).toLocaleString()}</p>
                  {item.payment_status === 'payout_pending' && (
                    <button
                      type="button"
                      onClick={() => releaseEscrow(item)}
                      disabled={releasingId === (item._id || item.id)}
                      className="mt-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50"
                    >
                      {releasingId === (item._id || item.id) ? 'Releasing...' : 'Release Payout'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-semibold text-slate-800">Recent Activity</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-5 py-4">
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            )) : activity.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No recent activity logs available.
              </div>
            ) : activity.slice(0, 8).map((log) => (
              <div key={log._id} className="px-5 py-4">
                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                <p className="text-sm text-slate-500">{log.details || 'No details'}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
