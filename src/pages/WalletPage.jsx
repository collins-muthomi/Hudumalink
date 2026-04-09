import { useState, useEffect } from 'react'
import { walletAPI } from '../services/api'
import { useToast } from '../context/contexts'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const txIcon = { credit: '⬇️', debit: '⬆️', transfer: '↔️', refund: '↩️' }
const txColor = { credit: 'text-emerald-600', debit: 'text-red-500', transfer: 'text-blue-600', refund: 'text-amber-600' }

export default function WalletPage() {
  const { toast } = useToast()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'topup' | 'withdraw' | 'transfer'
  const [form, setForm] = useState({ amount: '', phone: '', recipient_phone: '', note: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.allSettled([walletAPI.balance(), walletAPI.transactions()])
      .then(([b, t]) => {
        setBalance(b.status === 'fulfilled' ? b.value.data : null)
        setTransactions(t.status === 'fulfilled' ? (t.value.data.results || t.value.data) : [])
      }).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleTopup = async () => {
    if (!form.amount || !form.phone) { toast.error('Fill all fields'); return }
    setSubmitting(true)
    try {
      await walletAPI.topup({ amount: form.amount, phone: `+254${form.phone}` })
      toast.success('STK Push sent!', `Check your phone for M-Pesa prompt.`)
      setModal(null)
      setForm({ amount: '', phone: '', recipient_phone: '', note: '' })
      const r = await walletAPI.balance()
      setBalance(r.data)
    } catch (err) { toast.error('Top-up failed', err.response?.data?.detail || 'Please try again.') }
    finally { setSubmitting(false) }
  }

  const handleWithdraw = async () => {
    if (!form.amount || !form.phone) { toast.error('Fill all fields'); return }
    setSubmitting(true)
    try {
      await walletAPI.withdraw({ amount: form.amount, phone: `+254${form.phone}` })
      toast.success('Withdrawal initiated!', 'Funds will arrive within minutes.')
      setModal(null)
      const r = await walletAPI.balance()
      setBalance(r.data)
    } catch (err) { toast.error('Withdrawal failed', err.response?.data?.detail || 'Insufficient balance or error.') }
    finally { setSubmitting(false) }
  }

  const handleTransfer = async () => {
    if (!form.amount || !form.recipient_phone) { toast.error('Fill all fields'); return }
    setSubmitting(true)
    try {
      await walletAPI.transfer({ amount: form.amount, recipient_phone: `+254${form.recipient_phone}`, note: form.note })
      toast.success('Transfer sent!', `KSh ${form.amount} transferred successfully.`)
      setModal(null)
      const r = await walletAPI.balance()
      setBalance(r.data)
    } catch (err) { toast.error('Transfer failed', err.response?.data?.detail || 'Please check the recipient number.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Wallet</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your HudumaLink balance</p>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-teal-700 p-6 text-white shadow-glow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-primary-200 text-sm font-medium">Available Balance</p>
          {loading ? (
            <div className="skeleton h-10 w-40 rounded-xl mt-2 bg-white/20" />
          ) : (
            <p className="font-display font-bold text-4xl mt-1">
              KSh {Number(balance?.balance || 0).toLocaleString()}
            </p>
          )}
          {balance?.currency && <p className="text-primary-200 text-xs mt-1">{balance.currency}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { action: 'topup', emoji: '⬇️', label: 'Top Up', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
          { action: 'withdraw', emoji: '⬆️', label: 'Withdraw', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
          { action: 'transfer', emoji: '↔️', label: 'Transfer', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
        ].map(a => (
          <button key={a.action} onClick={() => setModal(a.action)}
            className={`${a.color} border rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors`}>
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-sm font-semibold">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">Transaction History</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-3 items-center">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
            </div>
          )) : transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-sm text-slate-400">No transactions yet</p>
            </div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                {txIcon[tx.type] || '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{tx.description || tx.type}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${txColor[tx.type] || 'text-slate-700'}`}>
                  {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}KSh {Number(tx.amount).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{tx.status || 'completed'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Up Modal */}
      <Modal open={modal === 'topup'} onClose={() => setModal(null)} title="Top Up Wallet"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={handleTopup} loading={submitting}>Send STK Push</Button></div>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Enter the amount and your M-Pesa number. An STK push will be sent to your phone.</p>
          <Input label="Amount (KSh)" type="number" placeholder="e.g. 500" value={form.amount} onChange={e => set('amount', e.target.value)} />
          <div>
            <label className="label-base">M-Pesa Phone Number</label>
            <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white border-slate-200">
              <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0"><span className="text-lg">🇰🇪</span><span className="text-sm font-medium text-slate-600">+254</span></div>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="712 345 678" className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={modal === 'withdraw'} onClose={() => setModal(null)} title="Withdraw to M-Pesa"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" onClick={handleWithdraw} loading={submitting}>Withdraw</Button></div>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Funds will be sent to your M-Pesa number within minutes.</p>
          <Input label="Amount (KSh)" type="number" placeholder="e.g. 1000" value={form.amount} onChange={e => set('amount', e.target.value)} />
          <div>
            <label className="label-base">M-Pesa Number to receive funds</label>
            <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white border-slate-200">
              <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0"><span className="text-lg">🇰🇪</span><span className="text-sm font-medium text-slate-600">+254</span></div>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="712 345 678" className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={modal === 'transfer'} onClose={() => setModal(null)} title="Transfer to User"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={handleTransfer} loading={submitting}>Send Transfer</Button></div>}>
        <div className="space-y-4">
          <Input label="Amount (KSh)" type="number" placeholder="e.g. 200" value={form.amount} onChange={e => set('amount', e.target.value)} />
          <div>
            <label className="label-base">Recipient Phone Number</label>
            <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white border-slate-200">
              <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0"><span className="text-lg">🇰🇪</span><span className="text-sm font-medium text-slate-600">+254</span></div>
              <input type="tel" value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="712 345 678" className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
            </div>
          </div>
          <Input label="Note (optional)" placeholder="e.g. For groceries" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
