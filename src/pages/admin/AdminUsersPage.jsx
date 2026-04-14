import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = () => {
    let active = true

    setLoading(true)
    adminAPI.users({ page, role: role || undefined, search: search || undefined, status: status || undefined })
      .then(({ data }) => {
        if (!active) return
        setUsers(data.results || [])
        setCount(data.count || 0)
      })
      .catch(() => {
        if (!active) return
        setUsers([])
        setCount(0)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }

  useEffect(() => {
    const cleanup = loadUsers()
    return cleanup
  }, [page, role, search, status])

  const suspendUser = async () => {
    if (!selectedUser) return
    if (!suspensionReason.trim()) {
      toast.error('Reason required', 'Please provide a suspension reason.')
      return
    }

    setSaving(true)
    try {
      await adminAPI.updateUser(selectedUser._id, {
        is_active: false,
        suspension_reason: suspensionReason.trim(),
      })
      toast.success('Account suspended', `${selectedUser.first_name} has been frozen.`)
      setSelectedUser(null)
      setSuspensionReason('')
      loadUsers()
    } catch (error) {
      toast.error('Suspend failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const reactivateUser = async (user) => {
    setSaving(true)
    try {
      await adminAPI.updateUser(user._id, { is_active: true })
      toast.success('Account reactivated', `${user.first_name} can access the platform again.`)
      loadUsers()
    } catch (error) {
      toast.error('Reactivation failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold text-2xl text-slate-900">Admin Users</h1>
        <p className="text-sm text-slate-500">Browse accounts, freeze access, and reactivate users when needed.</p>
      </div>

      <div className="card p-4 grid gap-3 md:grid-cols-[1fr_220px_220px]">
        <input
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          placeholder="Search by name, email, or phone"
          className="input"
        />
        <select
          value={role}
          onChange={(event) => {
            setPage(1)
            setRole(event.target.value)
          }}
          className="input"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="provider">Provider</option>
          <option value="delivery_driver">Delivery driver</option>
          <option value="restaurant_owner">Restaurant</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="input"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-800">Users</h2>
          <span className="badge bg-slate-100 text-slate-700">{count} total</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="px-5 py-4">
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          )) : users.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No users matched this filter.
            </div>
          ) : users.map((user) => (
            <div key={user._id} className="px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unnamed user'}
                </p>
                <p className="text-sm text-slate-500">{user.email || user.phone || 'No contact info'}</p>
                {!user.is_active && user.suspension_reason && (
                  <p className="text-xs text-red-600 mt-2">
                    Suspended: {user.suspension_reason}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge bg-blue-50 text-blue-700">{user.role}</span>
                  <span className={`badge ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                  <span className={`badge ${user.is_verified ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {user.is_active ? (
                    <Button size="sm" variant="danger" onClick={() => {
                      setSelectedUser(user)
                      setSuspensionReason(user.suspension_reason || '')
                    }}>
                      Freeze Account
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => reactivateUser(user)} loading={saving}>
                      Reactivate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1 || loading}
          className="btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <p className="text-sm text-slate-500">Page {page}</p>
        <button
          onClick={() => setPage((current) => current + 1)}
          disabled={loading || users.length === 0 || page * 20 >= count}
          className="btn-secondary disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <Modal
        open={!!selectedUser}
        onClose={() => {
          if (saving) return
          setSelectedUser(null)
          setSuspensionReason('')
        }}
        title={selectedUser ? `Freeze ${selectedUser.first_name}'s account` : 'Freeze account'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => {
              setSelectedUser(null)
              setSuspensionReason('')
            }} disabled={saving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={suspendUser} loading={saving}>
              Freeze Account
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This will block the user from accessing HudumaLink until an admin reactivates the account.
          </p>
          <div>
            <label className="label-base">Suspension reason</label>
            <textarea
              rows={4}
              className="input-base resize-none"
              value={suspensionReason}
              onChange={(event) => setSuspensionReason(event.target.value)}
              placeholder="Explain which company rule was broken..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
