import { forwardRef } from 'react'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50 font-medium px-5 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: '',
  lg: 'text-base px-7 py-3.5 rounded-2xl',
  xl: 'text-lg px-9 py-4 rounded-2xl',
  icon: 'p-2 rounded-lg',
}

const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', loading = false, className = '', disabled, fullWidth, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        variants[variant] || variants.primary,
        sizes[size] || '',
        fullWidth ? 'w-full flex items-center justify-center' : 'inline-flex items-center justify-center gap-2',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

export default Button
