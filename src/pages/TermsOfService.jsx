import PublicSiteShell from '../components/layout/PublicSiteShell'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Register', to: '/register' },
]

export default function TermsOfService() {
  return (
    <PublicSiteShell navLinks={NAV_LINKS}>
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Legal</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Terms of Service
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              HudumaLink connects customers with trusted local service providers across Nyeri and surrounding areas. By creating an account or using the platform, you agree to these terms.
            </p>

            <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600 sm:text-base">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Platform role</h2>
                <p className="mt-2">
                  HudumaLink helps customers discover providers, book services, and track payments. Providers remain independent service professionals and are responsible for the services they offer and deliver.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Payments and escrow</h2>
                <p className="mt-2">
                  Payments made through HudumaLink are held securely until service completion is confirmed. Customers should not pay providers directly through informal channels where a HudumaLink payment option is available.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Fees</h2>
                <p className="mt-2">
                  Platform fees or commissions may apply to certain bookings, payouts, or premium services. Any applicable fee is handled within the existing HudumaLink payment flow.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
                <p className="mt-2">
                  Users must provide accurate account information, interact respectfully, and avoid fraud, misuse, or abuse of the platform. Misuse may lead to account suspension or removal.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Updates</h2>
                <p className="mt-2">
                  These terms may be updated from time to time to reflect operational, legal, or platform changes. Continued use of HudumaLink means you accept the latest version made available on this page.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
