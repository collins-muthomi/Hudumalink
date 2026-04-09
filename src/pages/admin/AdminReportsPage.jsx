import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const reportTypes = [
  { value: 'food_orders', label: 'Food Orders' },
  { value: 'marketplace_orders', label: 'Marketplace Orders' },
  { value: 'service_requests', label: 'Service Requests' },
]

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('food_orders')
  const [reportData, setReportData] = useState({ count: 0, results: [] })
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    setLoading(true)
    Promise.allSettled([
      adminAPI.reports({ type: reportType }),
      adminAPI.activityLog(),
    ])
      .then(([reportResponse, activityResponse]) => {
        if (!active) return
        setReportData(reportResponse.status === 'fulfilled' ? reportResponse.value.data : { count: 0, results: [] })
        setActivity(activityResponse.status === 'fulfilled' ? activityResponse.value.data || [] : [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reportType])

  const renderTitle = (item) => {
    if (item.restaurant?.name) return item.restaurant.name
    if (item.product?.title) return item.product.title
    if (item.customer?.first_name || item.customer?.last_name) {
      return [item.customer.first_name, item.customer.last_name].filter(Boolean).join(' ')
    }
    return item._id
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-2xl text-slate-900">Admin Reports</h1>
        <p className="text-sm text-slate-500">Inspect operational records across food, marketplace, and services.</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
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
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-800">Results</h2>
            <span className="badge bg-slate-100 text-slate-700">{reportData.count || 0} records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-5 py-4">
                <div className="skeleton h-14 w-full rounded-xl" />
              </div>
            )) : (reportData.results || []).length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No records found for this report.
              </div>
            ) : (reportData.results || []).map((item) => (
              <div key={item._id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{renderTitle(item)}</p>
                  <p className="text-sm text-slate-500">{item.status || item.payment_status || 'No status'}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{item.total ? `KSh ${Number(item.total).toLocaleString()}` : item.amount ? `KSh ${Number(item.amount).toLocaleString()}` : 'Record'}</p>
                  <p>{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
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
                <p className="text-xs text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
