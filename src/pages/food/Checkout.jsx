import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { foodAPI } from '../../services/api'
import { useCart, useToast } from '../../context/contexts'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const paymentMethods = [
  { value: 'mpesa', label: 'M-Pesa', emoji: '📱', desc: 'Pay via M-Pesa STK push' },
  { value: 'wallet', label: 'HudumaLink Wallet', emoji: '💳', desc: 'Pay from your wallet balance' },
  { value: 'cash', label: 'Cash on Delivery', emoji: '💵', desc: 'Pay when food arrives' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { items, total, count, restaurantId, note, clearCart } = useCart()
  const [form, setForm] = useState({
    delivery_address: '',
    phone: user?.phone?.replace('+254', '') || '',
    payment_method: 'mpesa',
    mpesa_phone: user?.phone?.replace('+254', '') || '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const deliveryFee = 80
  const serviceFee = Math.round(total * 0.02)
  const grandTotal = total + deliveryFee + serviceFee

  const validate = () => {
    const e = {}
    if (!form.delivery_address.trim()) e.delivery_address = 'Delivery address is required'
    if (!form.phone || form.phone.length < 9) e.phone = 'Enter a valid phone number'
    if (form.payment_method === 'mpesa' && (!form.mpesa_phone || form.mpesa_phone.length < 9)) e.mpesa_phone = 'Enter M-Pesa number'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        restaurant: restaurantId,
        items: items.map(i => ({ menu_item: i.id, quantity: i.qty })),
        delivery_address: form.delivery_address,
        phone: `+254${form.phone}`,
        payment_method: form.payment_method,
        mpesa_phone: form.payment_method === 'mpesa' ? `+254${form.mpesa_phone}` : undefined,
        special_instructions: note,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
      }
      const res = await foodAPI.createOrder(payload)
      setOrderId(res.data.id)
      setPlaced(true)
      clearCart()
      if (form.payment_method === 'mpesa') {
        toast.success('STK Push sent!', `Check your phone (+254${form.mpesa_phone}) for M-Pesa prompt.`)
      } else {
        toast.success('Order placed!', 'Your food is being prepared.')
      }
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fe = {}; Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v })
        setErrors(fe)
      }
      toast.error('Order failed', err.response?.data?.detail || 'Please try again.')
    } finally { setLoading(false) }
  }

  if (placed) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in">
      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Order Placed!</h2>
        <p className="text-slate-500 text-sm mb-1">Order #{orderId}</p>
        {form.payment_method === 'mpesa' && (
          <p className="text-sm text-amber-600 font-medium mt-3 bg-amber-50 rounded-xl p-3">
            📱 Check your phone for M-Pesa prompt to complete payment.
          </p>
        )}
        <p className="text-sm text-slate-400 mt-4 mb-6">Estimated delivery: 30–45 minutes</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/food')} className="btn-secondary flex-1 text-sm">Order Again</button>
          <button onClick={() => navigate('/dashboard/customer')} className="btn-primary flex-1 text-sm">Go Home</button>
        </div>
      </div>
    </div>
  )

  if (count === 0) { navigate('/food'); return null }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-xl text-slate-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Delivery address */}
        <div className="card p-4 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">📍 Delivery Details</h3>
          <div>
            <label className="label-base">Delivery Address</label>
            <textarea
              rows={2}
              placeholder="e.g. Nyeri Town, Kimathi Way, near GPO…"
              value={form.delivery_address}
              onChange={e => set('delivery_address', e.target.value)}
              className={`input-base resize-none text-sm ${errors.delivery_address ? 'border-red-400' : ''}`}
            />
            {errors.delivery_address && <p className="mt-1.5 text-xs text-red-500">{errors.delivery_address}</p>}
          </div>
          <div>
            <label className="label-base">Contact Phone</label>
            <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white border-slate-200">
              <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0">
                <span className="text-lg">🇰🇪</span>
                <span className="text-sm font-medium text-slate-600">+254</span>
              </div>
              <input type="tel" inputMode="numeric" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="712 345 678" className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
            </div>
            {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {/* Payment method */}
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">💳 Payment Method</h3>
          {paymentMethods.map(pm => (
            <label key={pm.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.payment_method === pm.value ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name="payment" value={pm.value} checked={form.payment_method === pm.value} onChange={() => set('payment_method', pm.value)} className="accent-primary-600" />
              <span className="text-xl">{pm.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{pm.label}</p>
                <p className="text-xs text-slate-400">{pm.desc}</p>
              </div>
            </label>
          ))}
          {form.payment_method === 'mpesa' && (
            <div className="mt-2">
              <label className="label-base">M-Pesa Phone Number</label>
              <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white border-slate-200">
                <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 flex-shrink-0">
                  <span className="text-lg">🇰🇪</span>
                  <span className="text-sm font-medium text-slate-600">+254</span>
                </div>
                <input type="tel" inputMode="numeric" value={form.mpesa_phone} onChange={e => set('mpesa_phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="712 345 678" className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
              </div>
              {errors.mpesa_phone && <p className="mt-1.5 text-xs text-red-500">{errors.mpesa_phone}</p>}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Order Summary</h3>
          <div className="space-y-1.5 text-sm text-slate-600">
            {items.map(i => (
              <div key={i.id} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span>KSh {(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
              <span>Delivery</span><span>KSh {deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span><span>KSh {serviceFee}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-100 pt-2 mt-1">
              <span>Total</span><span className="text-primary-600">KSh {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          {form.payment_method === 'mpesa' ? `Pay KSh ${grandTotal.toLocaleString()} via M-Pesa` : `Place Order — KSh ${grandTotal.toLocaleString()}`}
        </Button>
      </form>
    </div>
  )
}
