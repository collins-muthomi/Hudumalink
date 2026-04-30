import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 group"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon - visible in light mode */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2.75v2.5" />
        <path strokeLinecap="round" d="M12 18.75v2.5" />
        <path strokeLinecap="round" d="M2.75 12h2.5" />
        <path strokeLinecap="round" d="M18.75 12h2.5" />
        <path strokeLinecap="round" d="m5.46 5.46 1.77 1.77" />
        <path strokeLinecap="round" d="m16.77 16.77 1.77 1.77" />
        <path strokeLinecap="round" d="m5.46 18.54 1.77-1.77" />
        <path strokeLinecap="round" d="m16.77 7.23 1.77-1.77" />
      </svg>

      {/* Moon icon - visible in dark mode */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors duration-200" />
    </button>
  )
}
