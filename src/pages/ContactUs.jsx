import { useMemo, useState } from 'react'
import PublicSiteShell from '../components/layout/PublicSiteShell'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../context/contexts'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Services', to: '/services' },
  { label: 'About Us', to: '/about' },
  { label: 'Join As Provider', to: '/register' },
]

const supportCards = [
  { title: 'Customer Support', text: 'Help with bookings, browsing providers, and service confirmations.' },
  { title: 'Provider Support', text: 'Guidance for onboarding, visibility, verification, and service management.' },
  { title: 'Payment Support', text: 'Support for escrow payments, wallet questions, and payout follow-up.' },
]

const normalizePhone = (value) => value.replace(/[^\d+]/g, '')
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const isValidKenyanPhone = (value) => /^(?:\+254|254|0)(?:7\d{8}|1\d{8})$/.test(normalizePhone(value))

export default function ContactUs() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const contactInfo = useMemo(() => ([
    { label: 'Call Us', value: '+254 7XX XXX XXX' },
    { label: 'Email Us', value: 'support@hudumalink.co.ke' },
    { label: 'Location', value: 'Nyeri, Kenya' },
    { label: 'Operating Hours', value: 'Mon - Sat: 08:00 - 20:00\nSunday: 09:00 - 18:00' },
  ]), [])

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!form.email.trim()) nextErrors.email = 'Email address is required'
    else if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address'
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required'
    else if (!isValidKenyanPhone(form.phone)) nextErrors.phone = 'Enter a valid Kenyan phone number'
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required'
    if (!form.message.trim()) nextErrors.message = 'Message is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSending(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      setSubmitted(true)
      toast.success('Message received', 'Our team will get back to you as soon as possible.')
    } finally {
      setSending(false)
    }
  }

  return (
    <PublicSiteShell navLinks={NAV_LINKS}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:pb-18">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">HudumaLink</p>
            <h1 className="mt-4 font-display text-4xl font-bold text-slate-900 sm:text-5xl" style={{ fontFamily: 'Sora, sans-serif' }}>
              Connect With Us
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Whether you have a question about bookings, payments, providers, or support, our team is ready to assist you.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="rounded-[26px] bg-emerald-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white">OK</div>
                <h2 className="mt-5 font-display text-2xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Message sent successfully</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Thank you for reaching out to HudumaLink. Your message has been received and our team will respond as soon as possible.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setForm({ fullName: '', email: '', phone: '', subject: '', message: '' })
                  }}
                  className="mt-6 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Contact Form</p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Tell us how we can help</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={(event) => setField('fullName', event.target.value)}
                      error={errors.fullName}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="john@email.com"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="0712 345 678"
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      error={errors.phone}
                    />
                    <Input
                      label="Subject"
                      placeholder="What is this about?"
                      value={form.subject}
                      onChange={(event) => setField('subject', event.target.value)}
                      error={errors.subject}
                    />
                  </div>

                  <div>
                    <label className="label-base">Message</label>
                    <textarea
                      rows={7}
                      className={`input-base resize-none ${errors.message ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="How can we help you today?"
                      value={form.message}
                      onChange={(event) => setField('message', event.target.value)}
                    />
                    {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message}</p>}
                  </div>

                  <Button type="submit" loading={sending}>
                    Send My Message
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3d31_100%)] p-7 text-white shadow-[0_24px_80px_-40px_rgba(12,69,53,0.9)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Contact Information</p>
              <div className="mt-6 space-y-4">
                {contactInfo.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">{item.label}</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {supportCards.map((card) => (
                <div key={card.title} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
