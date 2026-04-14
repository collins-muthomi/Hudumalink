import { useEffect, useState } from 'react'
import { servicesAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ManageServices() {
  const { toast } = useToast()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: '', price_from: '', location: 'Nyeri Town' })

  const load = () => {
    setLoading(true)
    Promise.allSettled([servicesAPI.mine(), servicesAPI.categories()])
      .then(([servicesResponse, categoriesResponse]) => {
        setServices(servicesResponse.status === 'fulfilled' ? servicesResponse.value.data : [])
        setCategories(categoriesResponse.status === 'fulfilled' ? categoriesResponse.value.data : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await servicesAPI.create({
        ...form,
        price_from: form.price_from ? Number(form.price_from) : null,
      })
      toast.success('Service created', 'Your service is now visible to customers.')
      setForm({ title: '', description: '', category: '', price_from: '', location: 'Nyeri Town' })
      load()
    } catch (error) {
      toast.error('Could not create service', error.response?.data?.detail || 'Please check the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">My Services</h1>
        <p className="text-slate-500 text-sm mt-1">Verified providers can create and manage services customers can book directly.</p>
      </div>

      <form onSubmit={handleCreate} className="card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Service Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          <div>
            <label className="label-base">Category</label>
            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="input-base">
              <option value="">Select a category...</option>
              {categories.map((category) => <option key={category.id || category.slug} value={category.id || category.slug}>{category.name}</option>)}
            </select>
          </div>
          <Input label="Starting Price" type="number" value={form.price_from} onChange={(event) => setForm((prev) => ({ ...prev, price_from: event.target.value }))} />
          <Input label="Location" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea
            rows={4}
            className="input-base resize-none"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Create Service</Button>
        </div>
      </form>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Listed Services</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array(3).fill(0).map((_, index) => <div key={index} className="px-5 py-4"><div className="skeleton h-4 rounded" /></div>)
          ) : services.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">You have not listed any services yet.</div>
          ) : services.map((service) => (
            <div key={service._id || service.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{service.title}</p>
                <p className="text-xs text-slate-400 mt-1">{service.category_name || service.category}</p>
                <p className="text-sm text-slate-500 mt-2">{service.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary-600">{service.price_from ? `KSh ${Number(service.price_from).toLocaleString()}` : 'Custom pricing'}</p>
                <span className={`badge mt-2 ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {service.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
