import { useState, useEffect } from 'react'
import { providerAPI } from '../../services/api'
import { useToast } from '../../context/contexts'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

const statusColor = {
  confirmed: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BookingCalendar() {
  const { toast } = useToast()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(today.getDate())
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState({})
  const [savingAvail, setSavingAvail] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      providerAPI.bookings({ month: month + 1, year }),
      providerAPI.availability(),
    ]).then(([b, a]) => {
      const bkData = b.status === 'fulfilled' ? (b.value.data.results || b.value.data) : []
      setAllBookings(bkData)
      if (a.status === 'fulfilled') setAvailability(a.value.data || {})
    }).finally(() => setLoading(false))
  }, [month, year])

  useEffect(() => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`
    setBookings(allBookings.filter(b => b.date === dateStr))
  }, [selected, allBookings, month, year])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const getBookingCountForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return allBookings.filter(b => b.date === dateStr).length
  }

  const toggleAvailability = (day) => {
    const key = day.toLowerCase()
    setAvailability(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const saveAvailability = async () => {
    setSavingAvail(true)
    try {
      await providerAPI.updateAvailability(availability)
      toast.success('Availability saved!')
    } catch { toast.error('Failed to save', 'Please try again.') }
    finally { setSavingAvail(false) }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Booking Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your bookings and availability</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-display font-bold text-lg text-slate-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSelected = day === selected
              const count = getBookingCountForDay(day)
              return (
                <button
                  key={day}
                  onClick={() => setSelected(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150
                    ${isSelected ? 'bg-primary-600 text-white shadow-glow' : isToday ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-300' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {day}
                  {count > 0 && (
                    <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day bookings */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">
              {MONTHS[month]} {selected} — {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </h3>
            {loading ? (
              <div className="space-y-2">{Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-1">📅</p>
                <p className="text-xs text-slate-400">No bookings for this day</p>
              </div>
            ) : bookings.map(b => (
              <div key={b.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-800">{b.customer_name}</p>
                  <span className={`badge text-[10px] capitalize ${statusColor[b.status] || 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                </div>
                <p className="text-xs text-slate-500">{b.service_name} · {b.time}</p>
                {b.amount && <p className="text-xs text-primary-600 font-semibold mt-1">KSh {Number(b.amount).toLocaleString()}</p>}
              </div>
            ))}
          </div>

          {/* Availability */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Weekly Availability</h3>
            <div className="space-y-2">
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                <label key={day} className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-slate-700">{day}</span>
                  <div
                    onClick={() => toggleAvailability(day)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${availability[day.toLowerCase()] ? 'bg-primary-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${availability[day.toLowerCase()] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
              ))}
            </div>
            <button onClick={saveAvailability} disabled={savingAvail}
              className="mt-3 w-full text-xs font-medium py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50">
              {savingAvail ? 'Saving…' : 'Save Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
