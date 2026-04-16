import PublicSiteShell from '../components/layout/PublicSiteShell'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Register', to: '/register' },
]

export default function PrivacyPolicy() {
  return (
    <PublicSiteShell navLinks={NAV_LINKS}>
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Legal</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              HudumaLink values your privacy. This page summarizes how we handle personal information used to support bookings, account management, and secure platform operations.
            </p>

            <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600 sm:text-base">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
                <p className="mt-2">
                  We may collect your name, phone number, email address, booking data, provider details, and payment-related data necessary to support your HudumaLink account and service activity.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">How data is used</h2>
                <p className="mt-2">
                  Your data is used to create accounts, manage bookings, verify providers, communicate service updates, support secure payments, and improve customer and provider support.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Security and handling</h2>
                <p className="mt-2">
                  HudumaLink applies security measures to protect personal data, booking records, and transaction information. Access to sensitive information is limited to operational and support needs.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Data sharing</h2>
                <p className="mt-2">
                  We do not sell personal data. Information may only be used within the service flow, support process, compliance obligations, or essential platform operations.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">Policy updates</h2>
                <p className="mt-2">
                  This privacy notice may be updated as HudumaLink evolves. The most current version will be published here for review at any time.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
