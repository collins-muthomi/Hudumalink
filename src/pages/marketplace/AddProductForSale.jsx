import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketplaceAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const locations = ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mathira', 'Tetu', 'Kieni', 'Ndaragwa']
const conditions = [
  { value: 'new', label: 'New', desc: 'Brand new, unopened' },
  { value: 'like_new', label: 'Like New', desc: 'Used once or twice' },
  { value: 'good', label: 'Good', desc: 'Used but works great' },
  { value: 'fair', label: 'Fair', desc: 'Visible wear but functional' },
]

export default function AddProductForSale() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '', condition: 'good', location: 'Nyeri Town', phone: '', image: null })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => { marketplaceAPI.categories().then(r => setCategories(r.data)).catch(() => {}) }, [])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    set('image', file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Please select a category'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') data.append(k, v) })
      const res = await marketplaceAPI.create(data)
      toast.success('Product listed!', 'Your item is now live on the marketplace.')
      navigate(`/marketplace/${res.data.id}`)
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const fe = {}; Object.entries(d).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setErrors(fe)
      }
      toast.error('Failed to list product', 'Please fix the errors and try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-900">List Item for Sale</h1>
        <p className="text-slate-500 text-sm mt-1">Sell your items to buyers in Nyeri County</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Image upload */}
        <div>
          <label className="label-base">Product Photo</label>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 flex flex-col items-center justify-center text-slate-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Click to upload photo</p>
                <p className="text-xs mt-1">JPG, PNG up to 5MB</p>
              </div>
            )}
          </label>
        </div>

        <Input label="Product Title" placeholder="e.g. Samsung Galaxy A52 — 128GB" value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={`input-base ${errors.category ? 'border-red-400' : ''}`}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category}</p>}
          </div>
          <Input label="Price (KSh)" type="number" placeholder="e.g. 5000" value={form.price} onChange={e => set('price', e.target.value)} error={errors.price} />
        </div>

        {/* Condition */}
        <div>
          <label className="label-base">Condition</label>
          <div className="grid grid-cols-2 gap-2">
            {conditions.map(c => (
              <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                className={`p-3 rounded-xl border text-left transition-all ${form.condition === c.value ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-xs font-semibold text-slate-800">{c.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea rows={3} placeholder="Describe your item — features, reason for selling, any defects…" value={form.description} onChange={e => set('description', e.target.value)}
            className={`input-base resize-none ${errors.description ? 'border-red-400' : ''}`} />
          {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Location</label>
            <select value={form.location} onChange={e => set('location', e.target.value)} className="input-base">
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <Input label="WhatsApp Number (optional)" placeholder="712 345 678" value={form.phone} onChange={e => set('phone', e.target.value)} hint="+254 will be added" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} fullWidth={false} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} fullWidth={false} className="flex-1">List for Sale</Button>
        </div>
      </form>
    </div>
  )
}
