export default function PasswordStrength({ password }) {
  if (!password) return null

  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = checks.filter(c => c.pass).length

  const levels = [
    { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-500' },
    { label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-500' },
    { label: 'Good', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
    { label: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-500' },
    { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ]

  const level = levels[Math.min(score, 4)]

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? level.color : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map(c => (
            <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        <span className={`text-xs font-medium ${level.textColor}`}>{level.label}</span>
      </div>
    </div>
  )
}
