import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { providerAPI, serviceBookingsAPI } from '../services/api'
import { useToast } from '../context/contexts'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function ProviderProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [bookingForm, setBookingForm] = useState({ description: '', location: 'Nyeri Town', budget: '' })
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    providerAPI.profile(id)
      .then((response) => setProvider(response.data))
      .catch(() => setProvider(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    if (!selectedService) return
    setBooking(true)
    try {
      await serviceBookingsAPI.create({
        service: selectedService._id || selectedService.id,
        description: bookingForm.description,
        location: bookingForm.location,
        budget: bookingForm.budget ? Number(bookingForm.budget) : null,
      })
      toast.success('Service requested', 'The provider can now accept and manage the job.')
      setSelectedService(null)
      setBookingForm({ description: '', location: 'Nyeri Town', budget: '' })
      navigate('/my-requests')
    } catch (error) {
      toast.error('Booking failed', error.response?.data?.detail || 'Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-6 w-1/2 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    )
  }

  if (!provider) {
    return <div className="p-6 text-center text-slate-400">Provider not found.</div>
  }

  const rating = provider.averageRating || provider.average_rating
  const reviews = provider.reviews || []
  const services = provider.services || []
  const availableDays = days.filter((day) => provider.availability?.[day]).map((day) => day.slice(0, 3))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-3xl overflow-hidden flex-shrink-0">
            {provider.profileImage ? (
              <img src={provider.profileImage} alt={`${provider.first_name} ${provider.last_name}`} className="w-full h-full object-cover" />
            ) : (
              `${provider.first_name?.[0] || ''}${provider.last_name?.[0] || ''}`
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">{provider.first_name} {provider.last_name}</h1>
              {provider.is_verified && <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>}
            </div>
            <p className="text-slate-500 text-sm mt-1">{provider.service_type}</p>
            <div className="flex gap-4 flex-wrap mt-3 text-sm text-slate-500">
              <span>{provider.location || 'Nyeri County'}</span>
              <span>{provider.experience_years ? `${provider.experience_years} years experience` : 'Experience not listed'}</span>
              <span>{provider.response_time || 'Within 1 hr'}</span>
            </div>
            <div className="flex gap-4 flex-wrap mt-3 text-sm">
              <span className="font-semibold text-amber-500">{rating ? `${rating.toFixed(1)} / 5` : 'No rating yet'}</span>
              <span className="text-slate-500">{provider.totalReviews || provider.reviews_count || 0} reviews</span>
              <span className="text-slate-500">Availability: {availableDays.length ? availableDays.join(', ') : 'Not set'}</span>
            </div>
          </div>
        </div>

        {provider.bio && (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700 mb-1">About</p>
            <p className="text-sm text-slate-500 leading-relaxed">{provider.bio}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Services Offered</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {services.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No listed services yet.</div>
          ) : services.map((service) => (
            <div key={service._id || service.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{service.title}</p>
                <p className="text-xs text-slate-400 mt-1">{service.category_name || service.category}</p>
                <p className="text-sm text-slate-500 mt-2">{service.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {service.price_from && <p className="text-sm font-bold text-primary-600">From KSh {Number(service.price_from).toLocaleString()}</p>}
                <Button size="sm" className="mt-3" onClick={() => setSelectedService(service)}>Request Service</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Ratings & Reviews</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {reviews.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No reviews yet.</div>
          ) : reviews.map((review) => (
            <div key={review._id || review.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{review.reviewer_name || 'Customer'}</p>
                <p className="text-xs text-amber-500 font-medium">{review.rating}/5</p>
              </div>
              <p className="text-sm text-slate-500 mt-2">{review.comment || 'No written feedback.'}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService ? `Request ${selectedService.title}` : 'Request Service'}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setSelectedService(null)} disabled={booking}>Cancel</Button>
            <Button onClick={handleBook} loading={booking}>Send Request</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Location"
            value={bookingForm.location}
            onChange={(event) => setBookingForm((prev) => ({ ...prev, location: event.target.value }))}
          />
          <Input
            label="Budget"
            type="number"
            placeholder="Optional"
            value={bookingForm.budget}
            onChange={(event) => setBookingForm((prev) => ({ ...prev, budget: event.target.value }))}
          />
          <div>
            <label className="label-base">Notes for the provider</label>
            <textarea
              rows={4}
              value={bookingForm.description}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, description: event.target.value }))}
              className="input-base resize-none"
              placeholder="Share the problem, expectations, or preferred timing..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
