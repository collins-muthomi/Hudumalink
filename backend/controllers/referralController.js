const { Referral } = require('../models/index')
const User = require('../models/User')

// GET /api/referrals/my-code/
exports.myCode = async (req, res) => {
  let code = req.user.referral_code
  if (!code) {
    const { customAlphabet } = require('nanoid')
    const gen = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)
    code = gen()
    await User.findByIdAndUpdate(req.user._id, { referral_code: code })
  }
  res.json({ referral_code: code, referral_link: `https://hudumalink.co.ke/register?ref=${code}` })
}

// GET /api/referrals/stats/
exports.stats = async (req, res) => {
  const [total, successful] = await Promise.all([
    Referral.countDocuments({ referrer: req.user._id }),
    Referral.countDocuments({ referrer: req.user._id, status: 'completed' }),
  ])
  const rewards = await Referral.find({ referrer: req.user._id, status: 'completed' })
  const total_earned = rewards.reduce((s, r) => s + (r.reward || 0), 0)
  res.json({ total_referrals: total, successful_referrals: successful, total_earned })
}

// GET /api/referrals/history/
exports.history = async (req, res) => {
  const refs = await Referral.find({ referrer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('referred', 'first_name last_name')
  const results = refs.map(r => ({
    id: r._id,
    referred_name: r.referred ? `${r.referred.first_name} ${r.referred.last_name}` : r.referred_name,
    status: r.status,
    reward: r.reward,
    rewarded_at: r.rewarded_at,
    created_at: r.createdAt,
  }))
  res.json(results)
}
