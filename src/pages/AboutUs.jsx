import { Link } from 'react-router-dom'
import PublicSiteShell from '../components/layout/PublicSiteShell'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Services', to: '/services' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Join As Provider', to: '/register' },
]

const features = [
  'Verified Providers',
  'Secure Escrow Payments',
  'Fast Booking',
  'Local Support',
  'Transparent Pricing',
  'Reliable Service',
]

const categories = [
  { title: 'Home Services', items: ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting'] },
  { title: 'Beauty', items: ['Barber', 'Salon', 'Nails'] },
  { title: 'Tech', items: ['Phone Repair', 'Laptop Repair', 'WiFi Setup'] },
  { title: 'Moving', items: ['House Moving', 'Furniture Moving'] },
  { title: 'Personal', items: ['Tutoring', 'Gardening', 'Pet Care', 'Cobbler'] },
]

const howItWorks = [
  'Browse service categories',
  'Choose a provider',
  'Pay securely through HudumaLink',
  'Provider completes service',
  'Payment is released after confirmation',
]

export default function AboutUs() {
  return (
    <PublicSiteShell navLinks={NAV_LINKS}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:pb-20 lg:pt-18">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Welcome to HudumaLink
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'Sora, sans-serif' }}>
              Your Trusted Local Services Platform
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              At HudumaLink, we are proud to connect customers with trusted local service providers across Nyeri and surrounding areas.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              From plumbers and electricians to beauty professionals, tutors, and technicians, HudumaLink makes it easier to find reliable help whenever it is needed.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              We combine trust, convenience, verified providers, and secure payments to create a safer way to book local services.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Our Mission</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Our Mission</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Our mission is to transform how people access local services by creating a customer-first platform where users can quickly find trusted professionals while helping providers grow their businesses.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['simple', 'secure', 'transparent', 'accessible'].map((item) => (
                <span key={item} className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3a2c_55%,#072e22_100%)] p-7 text-white shadow-[0_24px_80px_-40px_rgba(12,69,53,0.9)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Our Commitment to You</p>
            <p className="mt-5 text-sm leading-7 text-slate-200">
              HudumaLink is committed to serving communities with a smarter way to access local services.
            </p>
            <div className="mt-6 space-y-3">
              {['verified providers', 'secure payments', 'customer protection', 'fair pricing', 'local empowerment'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">What Drives Us?</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>What Drives Us?</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
              Many people struggle with finding trustworthy providers, comparing service quality, safe payments, and quick availability. HudumaLink was built to remove that stress and make local services easier.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Why Choose Us</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Why customers trust HudumaLink</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-bold text-emerald-700">HL</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Designed to make every local service booking safer, clearer, and easier to trust.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">How It Works</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Simple and secure from start to finish</h2>
            <div className="mt-6 space-y-4">
              {howItWorks.map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <p className="text-sm font-semibold text-emerald-900">Customers do not pay providers directly.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">The platform securely holds funds until service completion, then releases payment after confirmation.</p>
            </div>
          </div>

          <div className="rounded-[30px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3d31_100%)] p-7 text-white shadow-[0_24px_80px_-40px_rgba(12,69,53,0.9)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Service Categories</p>
            <h2 className="mt-3 font-display text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Services built around local needs</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {categories.map((category) => (
                <div key={category.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">{category.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Your Data Security Matters</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Your Data Security Matters</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
              At HudumaLink, protecting your personal information is a priority. We implement security measures to protect customer data, provider information, transactions, and booking records.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[36px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3d31_100%)] px-6 py-10 text-center text-white shadow-[0_24px_80px_-45px_rgba(12,69,53,0.9)] sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Experience Services the HudumaLink Way</p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              Whether you need a plumber, cleaner, barber, or technician, HudumaLink makes finding trusted help simple.
            </p>
            <Link to="/register" className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
