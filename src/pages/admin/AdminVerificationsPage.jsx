import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  const loadVerifications = () => {
    setLoading(true)
    adminAPI.pendingVerifications()
      .then(({ data }) => setVerifications(data.results || []))
      .catch(() => setVerifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadVerifications()
  }, [])

  const handleApprove = async (id) => {
    setActingId(id)
    try {
      await adminAPI.approveVerification(id)
      setVerifications((current) => current.filter((item) => item.id !== id))
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:', 'Documents could not be verified.')
    if (reason === null) return

    setActingId(id)
    try {
      await adminAPI.rejectVerification(id, { reason })
      setVerifications((current) => current.filter((item) => item.id !== id))
    } finally {
      setActingId(null)
    }
  }

  const documentLinks = (verification) => [
    { label: 'ID Front', href: verification.id_front },
    { label: 'ID Back', href: verification.id_back },
    { label: 'Certificate', href: verification.certificate },
    { label: 'Photo', href: verification.profile_photo },
  ].filter((item) => item.href)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-2xl text-slate-900">Provider Verifications</h1>
        <p className="text-sm text-slate-500">Review pending provider documents and approve or reject submissions.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-800">Pending Queue</h2>
          <span className="badge bg-amber-100 text-amber-700">{verifications.length} pending</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-5 py-5">
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
          )) : verifications.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No pending verifications right now.
            </div>
          ) : verifications.map((verification) => (
            <div key={verification.id} className="px-5 py-5 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{verification.provider_name}</p>
                  <p className="text-sm text-slate-500">{verification.email || 'No email provided'}</p>
                  <p className="text-sm text-slate-500">{verification.service_type || 'Unknown service type'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApprove(verification.id)}
                    disabled={actingId === verification.id}
                    className="btn-primary disabled:opacity-50"
                  >
                    {actingId === verification.id ? 'Working...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(verification.id)}
                    disabled={actingId === verification.id}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {documentLinks(verification).length === 0 ? (
                  <span className="text-xs text-slate-400">No document links attached.</span>
                ) : documentLinks(verification).map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="badge bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
