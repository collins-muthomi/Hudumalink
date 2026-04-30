import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'
import { HudumaLogo } from '../LandingPage'

const roleDash = {
  customer: '/dashboard/customer',
  provider: '/dashboard/provider',
  delivery_driver: '/services',
  restaurant_owner: '/services',
  admin: '/dashboard/admin',
}

export default function VerifyEmail() {
  const { verifyEmail, resendVerificationCode } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const firstInputRef = useRef(null)

  const [email, setEmail] = useState(location.state?.email || '')
  const [role, setRole] = useState(location.state?.role || 'customer')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  const code = digits.join('')

  const setDigit = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setError('')

    if (value && index < 5) {
      document.getElementById(`verification-digit-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`verification-digit-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    if (!pastedDigits.length) return

    setDigits((prev) => prev.map((_, index) => pastedDigits[index] || ''))
    document.getElementById(`verification-digit-${Math.min(pastedDigits.length, 5)}`)?.focus()
    setError('')
  }

  const handleVerify = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (code.length !== 6) {
      setError('Enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      const result = await verifyEmail({ email, code })
      toast.success('Email verified!', 'Your account is ready to use.')
      navigate(roleDash[result.user?.role || role] || '/dashboard/customer', { replace: true })
    } catch (err) {
      const message = err.response?.data?.detail || 'Verification failed. Please try again.'
      setError(message)
      toast.error('Verification failed', message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Enter your email first so we know where to send the code.')
      return
    }

    setResending(true)
    try {
      await resendVerificationCode({ email })
      setDigits(['', '', '', '', '', ''])
      setError('')
      toast.success('Code sent', 'A new verification code is on its way to your inbox.')
      firstInputRef.current?.focus()
    } catch (err) {
      const message = err.response?.data?.detail || 'Unable to resend the code right now.'
      setError(message)
      toast.error('Resend failed', message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <HudumaLogo />
          </Link>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100">Verify your email</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter the 6-digit code we sent to your email address.</p>
        </div>

        <div className="card p-8 shadow-card">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="label-base">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError('') }}
                className="input-base"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label-base">Verification code</label>
              <div className="grid grid-cols-6 gap-2">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    id={`verification-digit-${index}`}
                    ref={index === 0 ? firstInputRef : undefined}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    className="input-base text-center text-lg font-semibold tracking-[0.2em] px-0"
                    aria-label={`Verification digit ${index + 1}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">This code expires in 15 minutes.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              Verify Account
            </Button>
            <Button type="button" variant="secondary" fullWidth loading={resending} onClick={handleResend}>
              Resend Code
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already verified? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
