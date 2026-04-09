import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/contexts'

export default function Cart() {
  const navigate = useNavigate()
  const { items, total, count, updateQty, removeItem, setNote, note, restaurantId } = useCart()

  if (count === 0) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in">
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🛒</p>
        <p className="font-display font-bold text-xl text-slate-900 mb-2">Your cart is empty</p>
        <p className="text-slate-400 text-sm mb-6">Add items from a restaurant to get started</p>
        <Link to="/food" className="btn-primary text-sm">Browse Restaurants</Link>
      </div>
    </div>
  )

  const deliveryFee = 80
  const serviceFee = Math.round(total * 0.02)
  const grandTotal = total + deliveryFee + serviceFee

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-xl text-slate-900">Your Cart</h1>
        <span className="badge bg-primary-100 text-primary-700 ml-auto">{count} item{count !== 1 ? 's' : ''}</span>
      </div>

      {/* Items */}
      <div className="card divide-y divide-slate-50">
        {items.map(item => (
          <div key={item.id} className="p-4 flex items-center gap-3">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
              <p className="text-sm text-primary-600 font-bold mt-0.5">KSh {Number(item.price).toLocaleString()}</p>
            </div>
            {/* Qty control */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateQty(item.id, item.qty - 1)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold"
              >−</button>
              <span className="text-sm font-semibold text-slate-800 w-4 text-center">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold"
              >+</button>
            </div>
            <button onClick={() => removeItem(item.id)} className="ml-1 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Special instructions */}
      <div className="card p-4">
        <label className="label-base">Special Instructions (optional)</label>
        <textarea
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Any allergies, special requests…"
          className="input-base resize-none text-sm"
        />
      </div>

      {/* Summary */}
      <div className="card p-4 space-y-2.5">
        <h3 className="font-semibold text-slate-800 mb-3">Order Summary</h3>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span><span>KSh {total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Delivery fee</span><span>KSh {deliveryFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Service fee (2%)</span><span>KSh {serviceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
          <span>Total</span><span className="text-primary-600">KSh {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <Link
        to="/food/checkout"
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
      >
        Proceed to Checkout
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
