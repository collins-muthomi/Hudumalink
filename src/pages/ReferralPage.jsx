import { useState, useEffect } from 'react'
import { referralAPI } from '../services/api'
import { useToast } from '../context/contexts'

export default function ReferralPage() {
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.allSettled([referralAPI.myCode(), referralAPI.stats(), referralAPI.history()])
      .then(([code, stats, hist]) => {
        const codeData = code.status === 'fulfilled' ? code.value.data : {}
        const statsData = stats.status === 'fulfilled' ? stats.value.data : {}
        setData({ ...codeData, ...statsData })
        setHistory(hist.status === 'fulfilled' ? (hist.value.data.results || hist.value.data) : [])
      }).finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    const text = data?.referral_code || ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied!', `Code ${text} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('Copy failed', 'Please copy the code manually'))
  }

  const handleShare = () => {
    const msg = `Join HudumaLink — Nyeri's #1 super app! Use my code ${data?.referral_code} to get a bonus. Download at hudumalink.co.ke`
    if (navigator.share) {
      navigator.share({ title: 'Join HudumaLink', text: msg })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Refer & Earn 🎁</h1>
        <p className="text-slate-500 text-sm mt-1">Invite friends to HudumaLink and earn rewards</p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-teal-600 text-white p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <p className="text-primary-100 text-sm mb-1">Earn for every referral</p>
          <p className="font-display font-bold text-3xl">KSh 50 <span className="text-xl font-medium text-primary-200">per signup</span></p>
          <p className="text-primary-100 text-xs mt-2">Your friend also gets KSh 30 on their first order</p>
        </div>
      </div>

      {/* Code */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Your Referral Code</h3>
        {loading ? (
          <div className="skeleton h-14 rounded-xl" />
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 border-2 border-dashed border-primary-200 rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-primary-600 tracking-widest flex-1">
              {data?.referral_code || '——'}
            </p>
            <button onClick={handleCopy}
              className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors">
            <span>💬</span> Share via WhatsApp
          </button>
          <button onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors">
            <span>🔗</span> Copy Link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Referrals', value: loading ? '—' : (data?.total_referrals || 0), icon: '👥' },
          { label: 'Successful', value: loading ? '—' : (data?.successful_referrals || 0), icon: '✅' },
          { label: 'Earned', value: loading ? '—' : `KSh ${Number(data?.total_earned || 0).toLocaleString()}`, icon: '💰' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="font-display font-bold text-lg text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your unique referral code to friends and family in Nyeri' },
            { step: '2', title: 'They sign up', desc: 'Your friend creates an account using your referral code' },
            { step: '3', title: 'Earn rewards', desc: 'You get KSh 50 added to your wallet after their first transaction' },
          ].map(s => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{s.step}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Referral History</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex gap-3">
              <div className="skeleton h-4 w-full rounded" />
            </div>
          )) : history.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm text-slate-400">No referrals yet. Start sharing!</p>
            </div>
          ) : history.map((r, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{r.referred_name || `User #${r.id}`}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</p>
              </div>
              <div className="text-right">
                <span className={`badge capitalize ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                {r.reward && <p className="text-xs text-emerald-600 font-semibold mt-1">+KSh {Number(r.reward).toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
