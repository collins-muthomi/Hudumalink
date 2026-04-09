import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marketplaceAPI } from '../../services/api'
import { useToast } from '../../context/contexts'
import Button from '../../components/ui/Button'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    marketplaceAPI.detail(id).then(r => setProduct(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleOrder = async () => {
    setOrdering(true)
    try {
      const res = await marketplaceAPI.createOrder({ product: id, quantity: 1 })
      toast.success('Order placed!', 'The seller will contact you.')
      navigate(`/my-orders`)
    } catch (err) {
      toast.error('Failed', err.response?.data?.detail || 'Could not place order.')
    } finally { setOrdering(false) }
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="skeleton h-6 w-2/3 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  )
  if (!product) return <div className="p-6 text-center text-slate-400">Product not found.</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          {product.image ? (
            <img src={product.image} alt={product.title} className="w-full h-72 object-cover rounded-2xl" />
          ) : (
            <div className="w-full h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-6xl">🛒</div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-primary-50 text-primary-700">{product.category_name || product.category}</span>
              {product.condition && <span className="badge bg-slate-100 text-slate-600 capitalize">{product.condition}</span>}
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-900">{product.title}</h1>
            <p className="font-bold text-3xl text-primary-600 mt-2">KSh {Number(product.price).toLocaleString()}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Seller</span><span className="font-medium text-slate-700">{product.seller_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="font-medium text-slate-700">{product.location}</span></div>
            {product.phone && <div className="flex justify-between"><span className="text-slate-400">Contact</span><span className="font-medium text-slate-700">{product.phone}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Listed</span><span className="font-medium text-slate-700">{new Date(product.created_at).toLocaleDateString()}</span></div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Description</p>
            <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleOrder} loading={ordering} fullWidth={false} className="flex-1">
              Buy Now
            </Button>
            {product.phone && (
              <a href={`https://wa.me/+254${product.phone}?text=Hi, I'm interested in ${product.title} on HudumaLink`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border border-emerald-300 bg-emerald-50 text-emerald-700 font-medium text-sm py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                💬 WhatsApp Seller
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
