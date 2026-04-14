import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestsAPI, servicesAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function PostServiceRequest() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ title: '', description: '', category: '', budget: '', location: 'Nyeri Town' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    servicesAPI.categories().then((response) => setCategories(response.data)).catch(() => {})
  }, [])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required'
    if (!form.description.trim()) nextErrors.description = 'Description is required'
    if (!form.category) nextErrors.category = 'Please select a category'
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await requestsAPI.create({
        ...form,
        budget: form.budget ? Number(form.budget) : null,
      })
      toast.success('Request posted!', 'Verified providers can now accept it.')
      navigate(`/services/request/${response.data._id || response.data.id}`)
    } catch (error) {
      toast.error('Failed to post', error.response?.data?.detail || 'Please check the form and try again.')
    } finally {
      setLoading(false)
    }
  }

  const locations = ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mathira', 'Tetu', 'Kieni', 'Ndaragwa']

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-900">Post a Customer Request</h1>
        <p className="text-slate-500 text-sm mt-1">Describe the job you need and let verified providers pick it up</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <Input
          label="Request Title"
          placeholder="e.g. I need a plumber in Nyeri"
          value={form.title}
          onChange={(event) => setField('title', event.target.value)}
          error={errors.title}
        />

        <div>
          <label className="label-base">Category</label>
          <select
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            className={`input-base ${errors.category ? 'border-red-400' : ''}`}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id || category.slug} value={category.id || category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category}</p>}
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            rows={5}
            placeholder="Share the location, scope, timing, and anything the provider should know..."
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            className={`input-base resize-none ${errors.description ? 'border-red-400' : ''}`}
          />
          {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>}
        </div>

        <Input
          label="Budget"
          type="number"
          placeholder="Optional estimated budget"
          value={form.budget}
          onChange={(event) => setField('budget', event.target.value)}
          error={errors.budget}
        />

        <div>
          <label className="label-base">Location</label>
          <select value={form.location} onChange={(event) => setField('location', event.target.value)} className="input-base">
            {locations.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} fullWidth={false} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} fullWidth={false} className="flex-1">
            Post Request
          </Button>
        </div>
      </form>
    </div>
  )
}
