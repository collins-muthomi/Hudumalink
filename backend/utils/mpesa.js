const axios = require('axios')

const MPESA_BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

// Get OAuth token
const getMpesaToken = async () => {
  const creds = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')
  const res = await axios.get(
    `${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` } }
  )
  return res.data.access_token
}

// STK Push (Lipa Na M-Pesa Online)
const stkPush = async ({ phone, amount, accountRef, description }) => {
  const token = await getMpesaToken()
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')

  // Format phone: 0712345678 → 254712345678
  const formatted = phone.replace(/^\+/, '').replace(/^0/, '254')

  const res = await axios.post(
    `${MPESA_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formatted,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formatted,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountRef || 'HudumaLink',
      TransactionDesc: description || 'HudumaLink Payment',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.data
}

// B2C (withdraw to M-Pesa)
const b2cTransfer = async ({ phone, amount, remarks }) => {
  const token = await getMpesaToken()
  const formatted = phone.replace(/^\+/, '').replace(/^0/, '254')
  const res = await axios.post(
    `${MPESA_BASE}/mpesa/b2c/v1/paymentrequest`,
    {
      InitiatorName: 'HudumaLink',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: formatted,
      Remarks: remarks || 'Withdrawal',
      QueueTimeOutURL: process.env.MPESA_CALLBACK_URL + '/timeout',
      ResultURL: process.env.MPESA_CALLBACK_URL + '/result',
      Occasion: '',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.data
}

module.exports = { stkPush, b2cTransfer, getMpesaToken }
