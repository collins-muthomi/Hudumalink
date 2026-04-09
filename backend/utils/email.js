const nodemailer = require('nodemailer')

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    // Ethereal fake SMTP for dev
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal_user', pass: 'ethereal_pass' },
    })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HudumaLink</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">HudumaLink</span>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Nyeri County Super App</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} HudumaLink · Nyeri County, Kenya</p>
            <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;">If you did not request this email, please ignore it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const templates = {
  welcome: ({ first_name }) => ({
    subject: `Welcome to HudumaLink, ${first_name}! 🎉`,
    html: baseTemplate(`
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 12px;">Welcome, ${first_name}! 👋</h2>
      <p style="color:#475569;line-height:1.7;margin:0 0 16px;">You're now part of Nyeri's #1 super app. Here's what you can do:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${[
          ['🛠️', 'Book Services', 'Find skilled professionals in your area'],
          ['🛒', 'Marketplace', 'Buy & sell goods locally'],
          ['🍔', 'Order Food', 'Get food delivered fast'],
          ['💳', 'Wallet', 'Pay & get paid seamlessly'],
        ].map(([e, t, d]) => `
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:36px;font-size:20px;">${e}</td>
            <td style="padding:10px 0 10px 8px;vertical-align:top;">
              <strong style="color:#0f172a;font-size:14px;">${t}</strong>
              <p style="color:#64748b;font-size:13px;margin:2px 0 0;">${d}</p>
            </td>
          </tr>`).join('')}
      </table>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/customer"
         style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-weight:600;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
        Get Started →
      </a>
    `),
  }),

  passwordChanged: ({ first_name }) => ({
    subject: 'Your HudumaLink password was changed',
    html: baseTemplate(`
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 12px;">Password Changed</h2>
      <p style="color:#475569;line-height:1.7;">Hi ${first_name}, your password was changed successfully.</p>
      <p style="color:#475569;line-height:1.7;">If you did not make this change, please contact support immediately at <a href="mailto:support@hudumalink.co.ke" style="color:#0d9488;">support@hudumalink.co.ke</a></p>
    `),
  }),

  verificationApproved: ({ first_name }) => ({
    subject: '✅ Your provider account is verified!',
    html: baseTemplate(`
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 12px;">You're Verified! 🏆</h2>
      <p style="color:#475569;line-height:1.7;">Hi ${first_name}, congratulations!</p>
      <p style="color:#475569;line-height:1.7;">Your provider account has been verified. You now have a <strong style="color:#059669;">✅ Verified Badge</strong> on your profile, which helps customers trust and choose your services.</p>
      <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#065f46;font-weight:600;margin:0 0 4px;">What this means:</p>
        <p style="color:#047857;font-size:13px;margin:0;">You'll appear higher in search results and customers can book you with confidence.</p>
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/provider"
         style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-weight:600;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
        Go to Dashboard →
      </a>
    `),
  }),

  newBooking: ({ provider_name, customer_name, service, date, time, amount }) => ({
    subject: `New booking: ${service}`,
    html: baseTemplate(`
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 12px;">New Booking 📅</h2>
      <p style="color:#475569;">Hi ${provider_name}, you have a new booking request!</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
        ${[
          ['Customer', customer_name],
          ['Service', service],
          ['Date', date],
          ['Time', time],
          ['Amount', amount ? `KSh ${Number(amount).toLocaleString()}` : 'TBD'],
        ].map(([l, v]) => `
          <tr>
            <td style="color:#64748b;font-size:13px;padding:6px 0;width:100px;">${l}</td>
            <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${v}</td>
          </tr>`).join('')}
      </table>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/provider/bookings"
         style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;">
        View Booking →
      </a>
    `),
  }),

  orderConfirmed: ({ first_name, order_id, total, restaurant_name }) => ({
    subject: `Order confirmed — ${restaurant_name}`,
    html: baseTemplate(`
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 12px;">Order Confirmed! 🍔</h2>
      <p style="color:#475569;">Hi ${first_name}, your order from <strong>${restaurant_name}</strong> has been confirmed.</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#166534;font-weight:700;margin:0 0 4px;">Order #${String(order_id).slice(-8).toUpperCase()}</p>
        <p style="color:#15803d;font-size:18px;font-weight:800;margin:0;">KSh ${Number(total).toLocaleString()}</p>
      </div>
      <p style="color:#475569;">Your food is being prepared and will be delivered shortly. Estimated time: 30–45 minutes.</p>
    `),
  }),
}

const sendEmail = async ({ to, template, data }) => {
  if (!process.env.SMTP_USER && process.env.NODE_ENV !== 'development') return
  try {
    const transporter = createTransporter()
    const { subject, html } = templates[template](data)
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'HudumaLink <noreply@hudumalink.co.ke>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.warn(`📧 Email send failed (${template}):`, err.message)
  }
}

module.exports = { sendEmail, templates }
