import { forwardRef } from 'react'

const PhoneInputKE = forwardRef(function PhoneInputKE({ label, error, value, onChange, name, ...props }, ref) {
  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 9) val = val.slice(0, 9)
    onChange?.({ target: { name, value: val } })
  }

  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className={`flex border rounded-xl overflow-hidden transition-all duration-200 ${error ? 'border-red-400' : 'border-slate-200'} focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white`}>
        {/* Flag + prefix */}
        <div className="flex items-center gap-2 px-3.5 bg-slate-50 border-r border-slate-200 flex-shrink-0 select-none">
          <span className="text-xl" role="img" aria-label="Kenya flag">🇰🇪</span>
          <span className="text-sm font-medium text-slate-600">+254</span>
        </div>
        {/* Input */}
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={value || ''}
          onChange={handleChange}
          placeholder="712 345 678"
          className="flex-1 px-3 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      <p className="mt-1 text-xs text-slate-400">Enter your number without the leading 0</p>
    </div>
  )
})

export default PhoneInputKE
