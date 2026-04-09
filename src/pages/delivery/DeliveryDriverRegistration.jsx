import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deliveryAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const vehicleTypes = [
  { value: 'bicycle', label: 'Bicycle', emoji: '🚲', desc: 'Eco-friendly, short distances' },
  { value: 'motorcycle', label: 'Motorcycle / Boda', emoji: '🏍️', desc: 'Fast, most common' },
  { value: 'car', label: 'Car / Probox', emoji: '🚗', desc: 'For bulky deliveries' },
  { value: 'tuktuk', label: 'Tuk-Tuk', emoji: '🛺', desc: 'Mid-sized loads' },
]

const docFields = [
  { key: 'id_document', label: 'National ID / Passport', required: true, desc: 'Front side, clear photo' },
  { key: 'driving_license', label: 'Driving License', required: false, desc: 'Required for motorcycle/car' },
  { key: 'vehicle_photo', label: 'Vehicle Photo', required: true, desc: 'Your delivery vehicle' },
  { key: 'profile_photo', label: 'Profile Photo', required: true, desc: 'Clear headshot' },
]

export default function DeliveryDriverRegistration() {
  const { toast } = useToast()
  const { updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    vehicle_type: 'motorcycle',
    vehicle_registration: '',
    service_area: 'Nyeri Town',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })
  const [docs, setDocs] = useState({})
  const [previews, setPreviews] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const areas = ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mathira', 'Tetu', 'Kieni', 'Ndaragwa', 'All of Nyeri County']

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const handleDoc = (key, file) => {
    setDocs(p => ({ ...p, [key]: file }))
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }))
  }

  const validate = () => {
    const e = {}
    if (!form.vehicle_registration.trim()) e.vehicle_registration = 'Vehicle registration is required'
    if (!form.emergency_contact_name.trim()) e.emergency_contact_name = 'Emergency contact name is required'
    if (!form.emergency_contact_phone.trim()) e.emergency_contact_phone = 'Emergency contact phone is required'
    if (!docs.id_document) e.id_document = 'ID document is required'
    if (!docs.vehicle_photo) e.vehicle_photo = 'Vehicle photo is required'
    if (!docs.profile_photo) e.profile_photo = 'Profile photo is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      Object.entries(docs).forEach(([k, f]) => data.append(k, f))
      await deliveryAPI.register(data)
      setSuccess(true)
      toast.success('Registration submitted!', 'We\'ll review your application within 24 hours.')
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        const fe = {}; Object.entries(d).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setErrors(fe)
      }
      toast.error('Registration failed', 'Please fix the errors and try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in">
      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🚴</div>
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Application Submitted!</h2>
        <p className="text-slate-500 text-sm mb-4">We'll review your application and documents within 24 hours. You'll receive a notification once approved.</p>
        <div className="space-y-2 text-xs text-slate-400 bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-medium text-slate-600">What happens next:</p>
          <p>1. Our team reviews your documents</p>
          <p>2. You receive an approval notification</p>
          <p>3. Start accepting delivery orders</p>
        </div>
        <Button onClick={() => navigate('/dashboard/driver')} fullWidth>Go to Dashboard</Button>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-900">Delivery Driver Registration</h1>
        <p className="text-slate-500 text-sm mt-1">Join our delivery network and earn money in Nyeri County</p>
      </div>

      {/* Perks */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { emoji: '💰', label: 'Earn KSh 200–500/delivery' },
          { emoji: '⏰', label: 'Flexible hours' },
          { emoji: '📱', label: 'App-based tracking' },
        ].map(p => (
          <div key={p.label} className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-center">
            <p className="text-2xl mb-1">{p.emoji}</p>
            <p className="text-[11px] font-medium text-primary-800">{p.label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle type */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Vehicle Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {vehicleTypes.map(vt => (
              <button key={vt.value} type="button" onClick={() => set('vehicle_type', vt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${form.vehicle_type === vt.value ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="text-2xl mb-1">{vt.emoji}</p>
                <p className="text-sm font-semibold text-slate-800">{vt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{vt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle & area */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Vehicle & Service Details</h3>
          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. KCB 123A"
            value={form.vehicle_registration}
            onChange={e => set('vehicle_registration', e.target.value.toUpperCase())}
            error={errors.vehicle_registration}
          />
          <div>
            <label className="label-base">Primary Service Area</label>
            <select value={form.service_area} onChange={e => set('service_area', e.target.value)} className="input-base">
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Emergency contact */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Emergency Contact</h3>
          <Input label="Contact Name" placeholder="Full name" value={form.emergency_contact_name}
            onChange={e => set('emergency_contact_name', e.target.value)} error={errors.emergency_contact_name} />
          <Input label="Contact Phone" placeholder="+254..." value={form.emergency_contact_phone}
            onChange={e => set('emergency_contact_phone', e.target.value)} error={errors.emergency_contact_phone} />
        </div>

        {/* Documents */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Required Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            {docFields.map(df => (
              <div key={df.key}>
                <label className="label-base">{df.label} {df.required ? '*' : ''}</label>
                <p className="text-[11px] text-slate-400 mb-1.5">{df.desc}</p>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) handleDoc(df.key, e.target.files[0]) }} className="hidden" />
                  {previews[df.key] ? (
                    <div className="relative rounded-xl overflow-hidden border border-primary-300 h-24">
                      <img src={previews[df.key]} alt={df.label} className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">✓</div>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center transition-all hover:border-primary-300 hover:bg-primary-50/40 ${errors[df.key] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                      <span className="text-xl mb-1">📷</span>
                      <p className="text-[11px] text-slate-400">Upload</p>
                    </div>
                  )}
                </label>
                {errors[df.key] && <p className="mt-1 text-xs text-red-500">{errors[df.key]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
          By submitting this application, you agree to HudumaLink's Driver Terms of Service and confirm that all information provided is accurate and complete.
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          Submit Application
        </Button>
      </form>
    </div>
  )
}
