import { useState, useEffect } from 'react'
import { providerAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'

const steps = [
  { key: 'personal', label: 'Personal Info', icon: '👤' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'review', label: 'Review & Submit', icon: '✅' },
]

const docTypes = [
  { key: 'id_front', label: 'National ID — Front', desc: 'Clear photo of front side' },
  { key: 'id_back', label: 'National ID — Back', desc: 'Clear photo of back side' },
  { key: 'certificate', label: 'Professional Certificate', desc: 'Relevant qualification (optional)' },
  { key: 'photo', label: 'Profile Photo', desc: 'Clear headshot for your profile' },
]

export default function ProviderVerification() {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ service_type: '', experience_years: '', bio: '', location: 'Nyeri Town' })
  const [docs, setDocs] = useState({})
  const [previews, setPreviews] = useState({})

  const locations = ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mathira', 'Tetu', 'Kieni', 'Ndaragwa']

  useEffect(() => {
    providerAPI.verificationStatus()
      .then(r => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleDoc = (key, file) => {
    setDocs(p => ({ ...p, [key]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(p => ({ ...p, [key]: url }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      Object.entries(docs).forEach(([k, f]) => data.append(k, f))
      await providerAPI.uploadVerification(data)
      toast.success('Submitted!', 'Your verification is under review. We\'ll notify you within 24–48 hours.')
      setStatus({ status: 'pending' })
    } catch (err) {
      toast.error('Submission failed', err.response?.data?.detail || 'Please check your documents and try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="p-6 space-y-4 max-w-xl mx-auto">
      {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
    </div>
  )

  if (status?.status === 'approved') return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in">
      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🏆</div>
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">You're Verified!</h2>
        <p className="text-slate-500 text-sm">Your provider profile now shows a verified badge, boosting trust with customers.</p>
        <div className="mt-5 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-medium">
          ✅ Verified Provider
        </div>
      </div>
    </div>
  )

  if (status?.status === 'pending') return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in">
      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">⏳</div>
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Under Review</h2>
        <p className="text-slate-500 text-sm">Your verification documents are being reviewed. This typically takes 24–48 hours.</p>
        <p className="text-xs text-slate-400 mt-4">Submitted: {status.submitted_at ? new Date(status.submitted_at).toLocaleDateString() : 'Recently'}</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Provider Verification</h1>
        <p className="text-slate-500 text-sm mt-1">Complete verification to earn the trusted badge and get more bookings</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-400' : 'bg-slate-100 text-slate-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-700' : 'text-slate-400'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Personal Info */}
      {step === 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Personal & Professional Info</h2>

          <div>
            <label className="label-base">Service Type / Profession</label>
            <input value={form.service_type} onChange={e => set('service_type', e.target.value)}
              placeholder="e.g. Electrician, Plumber, Hair Stylist" className="input-base" />
          </div>
          <div>
            <label className="label-base">Years of Experience</label>
            <input type="number" min="0" max="50" value={form.experience_years} onChange={e => set('experience_years', e.target.value)}
              placeholder="e.g. 5" className="input-base" />
          </div>
          <div>
            <label className="label-base">Service Location</label>
            <select value={form.location} onChange={e => set('location', e.target.value)} className="input-base">
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Professional Bio</label>
            <textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="Tell customers about your skills, experience, and what makes you stand out…"
              className="input-base resize-none" />
          </div>

          <Button fullWidth onClick={() => { if (!form.service_type.trim() || !form.experience_years) { toast.error('Missing info', 'Please fill all required fields.'); return; } setStep(1) }}>
            Next: Upload Documents
          </Button>
        </div>
      )}

      {/* Step 1 — Documents */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Upload Documents</h2>
          <p className="text-xs text-slate-400">All documents are stored securely and used only for verification.</p>

          {docTypes.map(dt => (
            <div key={dt.key}>
              <label className="label-base">{dt.label} {dt.key !== 'certificate' ? '*' : ''}</label>
              <p className="text-xs text-slate-400 mb-2">{dt.desc}</p>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*,application/pdf" onChange={e => { if (e.target.files[0]) handleDoc(dt.key, e.target.files[0]) }} className="hidden" />
                {previews[dt.key] ? (
                  <div className="relative rounded-xl overflow-hidden border border-primary-300">
                    <img src={previews[dt.key]} alt={dt.label} className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Change</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">Uploaded ✓</div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl h-28 flex flex-col items-center justify-center hover:border-primary-300 hover:bg-primary-50/40 transition-all text-slate-400">
                    <span className="text-2xl mb-1">📷</span>
                    <p className="text-xs font-medium">Click to upload</p>
                  </div>
                )}
              </label>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(0)} fullWidth={false} className="flex-1">Back</Button>
            <Button onClick={() => {
              if (!docs.id_front || !docs.id_back || !docs.photo) { toast.error('Missing documents', 'Please upload required documents (ID front, back, and profile photo).'); return }
              setStep(2)
            }} fullWidth={false} className="flex-1">Review & Submit</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Review & Submit</h2>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Profession</span><span className="font-medium text-slate-800">{form.service_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Experience</span><span className="font-medium text-slate-800">{form.experience_years} years</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-medium text-slate-800">{form.location}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Documents</span><span className="font-medium text-emerald-600">{Object.keys(docs).length} uploaded ✓</span></div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
            <p className="font-semibold mb-1">Before you submit:</p>
            <p>By submitting, you confirm that all documents are genuine and the information is accurate. False submissions will result in account suspension.</p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} fullWidth={false} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} loading={submitting} fullWidth={false} className="flex-1">Submit for Verification</Button>
          </div>
        </div>
      )}
    </div>
  )
}
