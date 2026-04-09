import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function PostServiceRequest() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', description: '', category: '', budget_min: '', budget_max: '', location: 'Nyeri Town', urgency: 'normal' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { servicesAPI.categories().then(r => setCategories(r.data)).catch(() => {}) }, [])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Please select a category'
    if (form.budget_min && form.budget_max && Number(form.budget_min) > Number(form.budget_max)) e.budget_max = 'Max must be greater than min'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = { ...form, budget_min: form.budget_min || null, budget_max: form.budget_max || null }
      const res = await servicesAPI.createRequest(payload)
      toast.success('Request posted!', 'Providers will be notified.')
      navigate(`/services/request/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fe = {}; Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setErrors(fe)
      }
      toast.error('Failed to post', 'Please check the form and try again.')
    } finally { setLoading(false) }
  }

  const urgencies = [
    { value: 'normal', label: 'Normal', desc: 'Within a few days', color: 'border-slate-200' },
    { value: 'urgent', label: 'Urgent', desc: 'Today or tomorrow', color: 'border-amber-300 bg-amber-50' },
    { value: 'asap', label: 'ASAP', desc: 'Right now!', color: 'border-red-300 bg-red-50' },
  ]

  const locations = ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mathira', 'Tetu', 'Kieni', 'Ndaragwa']

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-900">Post a Service Request</h1>
        <p className="text-slate-500 text-sm mt-1">Tell providers what you need and get quotes fast</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <Input label="Request Title" placeholder="e.g. Need a plumber for a burst pipe" value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />

        <div>
          <label className="label-base">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={`input-base ${errors.category ? 'border-red-400' : ''}`}>
            <option value="">Select a category…</option>
            {categories.map(c => <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>)}
          </select>
          {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category}</p>}
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            rows={4}
            placeholder="Describe what you need in detail. Include any specific requirements, materials needed, or important notes…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className={`input-base resize-none ${errors.description ? 'border-red-400' : ''}`}
          />
          {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Budget */}
        <div>
          <label className="label-base">Budget Range (KSh) — Optional</label>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Min (e.g. 500)" type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} error={errors.budget_min} />
            <Input placeholder="Max (e.g. 2000)" type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} error={errors.budget_max} />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label-base">Location</label>
          <select value={form.location} onChange={e => set('location', e.target.value)} className="input-base">
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label className="label-base">Urgency</label>
          <div className="grid grid-cols-3 gap-3">
            {urgencies.map(u => (
              <button
                key={u.value}
                type="button"
                onClick={() => set('urgency', u.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${form.urgency === u.value ? (u.value === 'asap' ? 'border-red-400 bg-red-50' : u.value === 'urgent' ? 'border-amber-400 bg-amber-50' : 'border-primary-400 bg-primary-50') : 'border-slate-200 hover:border-slate-300'}`}
              >
                <p className="text-xs font-bold text-slate-800">{u.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{u.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} fullWidth={false} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} fullWidth={false} className="flex-1">Post Request</Button>
        </div>
      </form>
    </div>
  )
}
