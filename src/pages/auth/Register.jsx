import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/contexts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PasswordStrength from '../../components/ui/PasswordStrength'
import PhoneInputKE from '../../components/ui/PhoneInputKE'
import { HudumaLogo } from '../LandingPage'

const roles = [
  { value: 'customer', label: 'Customer', desc: 'Book services', emoji: '👤' },
  { value: 'provider', label: 'Service Provider', desc: 'Offer your skills', emoji: '🛠️' },
]

export default function Register() {
  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'customer', agree_legal: false, marketing_consent: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone || form.phone.length < 9) e.phone = 'Enter a valid Kenyan phone number'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'At least 8 characters required'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    if (!form.agree_legal) e.agree_legal = 'You must agree to the Terms of Service and Privacy Policy.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: `+254${form.phone}`,
        password: form.password,
        role: form.role,
      }
      const result = await register(payload)
      if (result?.requiresVerification) {
        toast.success('Account created!', 'We sent a 6-digit verification code to your email.')
        navigate('/verify-email', {
          replace: true,
          state: {
            email: payload.email,
            role: payload.role,
          },
        })
        return
      }

      toast.success('Account created!', `Welcome to HudumaLink, ${result.first_name}!`)
      const dash = {
        customer: '/dashboard/customer',
        provider: '/dashboard/provider',
      }
      navigate(dash[result.role] || '/dashboard/customer')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v
        })
        setErrors(fieldErrors)
        toast.error('Registration failed', 'Please fix the errors below.')
      } else {
        toast.error('Registration failed', 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 py-10 transition-colors duration-300">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <HudumaLogo />
          </Link>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Join Nyeri's #1 super app</p>
        </div>

        <div className="card p-8 shadow-card">
          <div className="mb-6">
            <p className="label-base">I want to…</p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('role', r.value)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 ${form.role === r.value
                    ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-300'
                    : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-xl mb-1">{r.emoji}</div>
                  <p className="text-xs font-semibold text-slate-800">{r.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder=""
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                error={errors.first_name}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                placeholder=""
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                error={errors.last_name}
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <PhoneInputKE
              label="Phone number"
              name="phone"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              error={errors.phone}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={form.password} />
            </div>

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={e => set('confirm_password', e.target.value)}
              error={errors.confirm_password}
              autoComplete="new-password"
            />

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree_legal}
                  onChange={(e) => set('agree_legal', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs leading-6 text-slate-600">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-primary-600 underline underline-offset-2 transition hover:text-primary-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-primary-600 underline underline-offset-2 transition hover:text-primary-700">
                    Privacy Policy
                  </Link>.
                </span>
              </label>
              {errors.agree_legal && <p className="text-xs text-red-500">{errors.agree_legal}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketing_consent}
                  onChange={(e) => set('marketing_consent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs leading-6 text-slate-500">
                  I want to receive news, updates, and exclusive offers.
                </span>
              </label>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {errors.general}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create Account
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button type="button" className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center mt-5 text-xs text-slate-400">
            Review our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
