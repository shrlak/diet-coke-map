import { useEffect, useState, useCallback } from 'react'
import {
  X,
  Navigation,
  Heart,
  Phone,
  Clock,
  Package,
  Share2,
  Star,
  Bell,
  BellOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  CheckSquare,
} from 'lucide-react'
import type { Store, StoreReview, StockConfirmationSummary } from '../types'
import { useAuthStore } from '../store/authStore'
import StarRating from './StarRating'
import {
  addToFavorites,
  removeFromFavorites,
  isFavorited as checkFavorited,
  getStoreReviews,
  getMyReview,
  upsertStoreReview,
  deleteStoreReview,
  addStockAlert,
  removeStockAlert,
  getStockAlerts,
  getStockConfirmationSummary,
  addStockConfirmation,
  addCheckin,
  getRecentCheckinCount,
  getMyLastCheckin,
} from '../services/api'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`} ${period}`
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

type Tab = 'details' | 'reviews'

interface StoreDetailsModalProps {
  store: Store | null
  onClose: () => void
  distanceKm?: number
}

export default function StoreDetailsModal({ store, onClose, distanceKm }: StoreDetailsModalProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [tab, setTab] = useState<Tab>('details')
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<StoreReview[]>([])
  const [myReview, setMyReview] = useState<StoreReview | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  // Stock alerts (set of product IDs with active alert)
  const [alertedProductIds, setAlertedProductIds] = useState<Set<string>>(new Set())
  const [alertLoading, setAlertLoading] = useState<string | null>(null)

  // Confirmations: map of store_product.id → summary
  const [confirmations, setConfirmations] = useState<Record<string, StockConfirmationSummary>>({})
  // Track what the user has voted on this session (localStorage key per store)
  const [voted, setVoted] = useState<Record<string, boolean | null>>({})

  // Check-in state
  const [checkinCount, setCheckinCount] = useState(0)
  const [lastCheckin, setLastCheckin] = useState<string | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)

  useEffect(() => {
    if (!store) return
    setTab('details')
    setReviewsLoaded(false)
    setReviews([])
    setMyReview(null)
    setReviewRating(0)
    setReviewBody('')
    setConfirmations({})

    // Load voted state from localStorage
    const key = `dc-votes-${store.id}`
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
      setVoted(stored)
    } catch {
      setVoted({})
    }

    // Favorite check
    if (user) {
      checkFavorited(user.id, store.id).then(({ isFavorited }) => setFavorited(isFavorited))
      // Load alerts
      getStockAlerts(user.id).then(({ data }) => {
        const ids = new Set(data.map((a) => a.product_id))
        setAlertedProductIds(ids)
      })
    } else {
      setFavorited(false)
      setAlertedProductIds(new Set())
    }

    // Load confirmation summaries for all products
    if (store.store_products) {
      store.store_products.forEach((sp) => {
        getStockConfirmationSummary(sp.id).then((summary) => {
          setConfirmations((prev) => ({ ...prev, [sp.id]: summary }))
        })
      })
    }

    // Check-in data
    setCheckinCount(0)
    setLastCheckin(null)
    getRecentCheckinCount(store.id).then(setCheckinCount)
    if (user) {
      getMyLastCheckin(user.id, store.id).then(({ data }) => {
        setLastCheckin(data?.created_at ?? null)
      })
    }
  }, [store, user])

  const loadReviews = useCallback(async () => {
    if (!store || reviewsLoaded) return
    const [{ data: allReviews }, { data: mine }] = await Promise.all([
      getStoreReviews(store.id),
      user ? getMyReview(user.id, store.id) : Promise.resolve({ data: null }),
    ])
    setReviews(allReviews)
    if (mine) {
      setMyReview(mine)
      setReviewRating(mine.rating)
      setReviewBody(mine.body ?? '')
    }
    setReviewsLoaded(true)
  }, [store, user, reviewsLoaded])

  useEffect(() => {
    if (tab === 'reviews') loadReviews()
  }, [tab, loadReviews])

  if (!store) return null

  const today = new Date().getDay()
  const distanceMiles = distanceKm !== undefined ? (distanceKm * 0.621371).toFixed(1) : null

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  const getDirectionsUrl = () => {
    const addr = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}`
  }

  const handleFavorite = async () => {
    if (!user) return
    setFavLoading(true)
    if (favorited) {
      await removeFromFavorites(user.id, store.id)
      setFavorited(false)
    } else {
      await addToFavorites(user.id, store.id)
      setFavorited(true)
    }
    setFavLoading(false)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}store/${store.id}`
    if (navigator.share) {
      await navigator.share({ title: store.name, text: `${store.name} carries Diet Coke!`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handleCheckin = async () => {
    if (!user) return
    setCheckinLoading(true)
    await addCheckin(user.id, store.id)
    const newCount = await getRecentCheckinCount(store.id)
    setCheckinCount(newCount)
    setLastCheckin(new Date().toISOString())
    setCheckinLoading(false)
  }

  const handleConfirm = async (spId: string, isConfirmed: boolean) => {
    const already = voted[spId]
    if (already === isConfirmed) return
    await addStockConfirmation(spId, isConfirmed, user?.id)
    const newVoted = { ...voted, [spId]: isConfirmed }
    setVoted(newVoted)
    const key = `dc-votes-${store.id}`
    localStorage.setItem(key, JSON.stringify(newVoted))
    // Refresh summary
    const summary = await getStockConfirmationSummary(spId)
    setConfirmations((prev) => ({ ...prev, [spId]: summary }))
  }

  const handleAlertToggle = async (productId: string) => {
    if (!user) return
    setAlertLoading(productId)
    const isActive = alertedProductIds.has(productId)
    if (isActive) {
      await removeStockAlert(user.id, store.id, productId)
      setAlertedProductIds((prev) => { const s = new Set(prev); s.delete(productId); return s })
    } else {
      await addStockAlert(user.id, store.id, productId)
      setAlertedProductIds((prev) => new Set([...prev, productId]))
    }
    setAlertLoading(null)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || reviewRating === 0) return
    setReviewSubmitting(true)
    await upsertStoreReview(user.id, store.id, reviewRating, reviewBody)
    // Reload
    const [{ data: allReviews }, { data: mine }] = await Promise.all([
      getStoreReviews(store.id),
      getMyReview(user.id, store.id),
    ])
    setReviews(allReviews)
    setMyReview(mine)
    setReviewSubmitting(false)
  }

  const handleReviewDelete = async () => {
    if (!myReview) return
    await deleteStoreReview(myReview.id)
    setMyReview(null)
    setReviewRating(0)
    setReviewBody('')
    const { data } = await getStoreReviews(store.id)
    setReviews(data)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[2000]" onClick={onClose} aria-hidden="true" />

      <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-[#1A1A1A] text-lg leading-tight">{store.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {store.address}, {store.city}, {store.state} {store.zip}
              {distanceMiles && (
                <> · <span className="text-[#E8192C] font-medium">{distanceMiles} mi</span></>
              )}
            </p>
            {reviewsLoaded && reviews.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <StarRating value={Math.round(avgRating)} size={12} />
                <span className="text-xs text-gray-400">
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <button
              onClick={handleShare}
              title="Share this store"
              className="text-gray-400 hover:text-[#E8192C] p-1.5 rounded-lg hover:bg-red-50 transition-colors relative"
            >
              <Share2 size={16} />
              {shareCopied && (
                <span className="absolute -top-7 -left-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-100">
          {(['details', 'reviews'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'text-[#E8192C] border-b-2 border-[#E8192C]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'reviews' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <MessageSquare size={13} />
                  Reviews
                  {reviewsLoaded && reviews.length > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-[10px] rounded-full px-1.5">
                      {reviews.length}
                    </span>
                  )}
                </span>
              ) : (
                'Details'
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── DETAILS TAB ────────────────────────────────────────────── */}
          {tab === 'details' && (
            <div className="px-5 py-4 space-y-5">
              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#E8192C] text-white py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-[#c8102e] transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation size={15} />
                  Get Directions
                </a>

                {isAuthenticated ? (
                  <button
                    onClick={handleFavorite}
                    disabled={favLoading}
                    className={`px-4 py-2.5 border rounded-lg transition-all disabled:opacity-60 ${
                      favorited
                        ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                        : 'border-gray-200 text-gray-400 hover:border-[#E8192C]/40 hover:text-[#E8192C]'
                    }`}
                    title={favorited ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart size={17} fill={favorited ? '#E8192C' : 'none'} />
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                    title="Login to save favorites"
                  >
                    <Heart size={17} />
                  </a>
                )}

                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-[#E8192C] hover:border-[#E8192C]/40 transition-all"
                    title={`Call ${store.name}`}
                  >
                    <Phone size={16} />
                  </a>
                )}

                {/* Check-in button */}
                {isAuthenticated && (
                  <button
                    onClick={handleCheckin}
                    disabled={checkinLoading || Boolean(lastCheckin && Date.now() - new Date(lastCheckin).getTime() < 3_600_000)}
                    title={lastCheckin && Date.now() - new Date(lastCheckin).getTime() < 3_600_000 ? "You've already checked in recently" : "Check in — I'm here now!"}
                    className={`px-4 py-2.5 border rounded-lg transition-all disabled:opacity-50 flex flex-col items-center gap-0.5 ${
                      lastCheckin && Date.now() - new Date(lastCheckin).getTime() < 3_600_000
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <CheckSquare size={15} />
                    {checkinCount > 0 && <span className="text-[9px] font-semibold">{checkinCount}</span>}
                  </button>
                )}
              </div>

              {/* Check-in context line */}
              {checkinCount > 0 && (
                <p className="text-xs text-gray-400 -mt-2">
                  {checkinCount} {checkinCount === 1 ? 'person' : 'people'} checked in here in the last 24 hours
                </p>
              )}

              {store.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <a href={`tel:${store.phone}`} className="hover:text-[#E8192C] transition-colors">
                    {formatPhone(store.phone)}
                  </a>
                </div>
              )}

              {/* Products with confirmations + alerts */}
              {store.store_products && store.store_products.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={14} className="text-[#E8192C]" />
                    <h3 className="font-semibold text-sm text-[#1A1A1A]">Diet Coke Available</h3>
                    <span className="text-xs text-gray-400 ml-auto">Tap to confirm stock</span>
                  </div>
                  <div className="space-y-2">
                    {store.store_products.map((sp) => {
                      const conf = confirmations[sp.id]
                      const userVote = voted[sp.id] ?? null
                      const productId = sp.products?.id
                      const isAlerted = productId ? alertedProductIds.has(productId) : false
                      const isAlertLoading = alertLoading === productId
                      return (
                        <div
                          key={sp.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                            sp.in_stock
                              ? 'border-green-100 bg-green-50'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              sp.in_stock ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <span
                            className={`font-medium flex-1 ${
                              sp.in_stock ? 'text-green-700' : 'text-gray-300 line-through'
                            }`}
                          >
                            {sp.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '')}
                          </span>

                          {/* Confirm buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConfirm(sp.id, true)}
                              title="Confirm in stock"
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                                userVote === true
                                  ? 'bg-green-500 text-white'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <ThumbsUp size={10} />
                              {conf && conf.confirmed > 0 && (
                                <span className="text-[9px]">{conf.confirmed}</span>
                              )}
                            </button>
                            <button
                              onClick={() => handleConfirm(sp.id, false)}
                              title="Mark as out of stock"
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                                userVote === false
                                  ? 'bg-red-500 text-white'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <ThumbsDown size={10} />
                              {conf && conf.denied > 0 && (
                                <span className="text-[9px]">{conf.denied}</span>
                              )}
                            </button>
                            {/* Alert bell (auth only, out-of-stock products) */}
                            {isAuthenticated && !sp.in_stock && productId && (
                              <button
                                onClick={() => handleAlertToggle(productId)}
                                disabled={isAlertLoading}
                                title={isAlerted ? 'Cancel alert' : 'Notify me when in stock'}
                                className={`px-1.5 py-0.5 rounded transition-colors disabled:opacity-50 ${
                                  isAlerted
                                    ? 'text-[#E8192C] bg-red-50'
                                    : 'text-gray-400 hover:text-[#E8192C] hover:bg-red-50'
                                }`}
                              >
                                {isAlerted ? <BellOff size={10} /> : <Bell size={10} />}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {store.store_products[0]?.last_verified_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      DB last updated:{' '}
                      {new Date(store.store_products[0].last_verified_at).toLocaleDateString()}
                    </p>
                  )}
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-400 mt-1">
                      <a href="/login" className="text-[#E8192C] hover:underline">Sign in</a> to get alerts when products come back in stock.
                    </p>
                  )}
                </div>
              )}

              {/* Store hours */}
              {store.store_hours && store.store_hours.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-[#E8192C]" />
                    <h3 className="font-semibold text-sm text-[#1A1A1A]">Store Hours</h3>
                  </div>
                  <div className="space-y-1.5">
                    {Array.from({ length: 7 }, (_, i) => i).map((day) => {
                      const hours = store.store_hours?.find((h) => h.day_of_week === day)
                      const isToday = day === today
                      return (
                        <div
                          key={day}
                          className={`flex justify-between text-sm py-0.5 ${isToday ? 'font-semibold' : ''}`}
                        >
                          <span className={isToday ? 'text-[#E8192C]' : 'text-gray-500'}>
                            {DAY_NAMES[day]}
                          </span>
                          <span className={isToday ? 'text-[#1A1A1A]' : 'text-gray-400'}>
                            {!hours || hours.is_closed
                              ? 'Closed'
                              : `${formatTime(hours.opens_at)} – ${formatTime(hours.closes_at)}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS TAB ────────────────────────────────────────────── */}
          {tab === 'reviews' && (
            <div className="px-5 py-4 space-y-5">
              {/* Write / edit review */}
              {isAuthenticated ? (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#1A1A1A]">
                      {myReview ? 'Your Review' : 'Leave a Review'}
                    </h3>
                    {myReview && (
                      <button
                        onClick={handleReviewDelete}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <StarRating value={reviewRating} onChange={setReviewRating} size={24} />
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your experience… (optional)"
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C]/20 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={reviewRating === 0 || reviewSubmitting}
                      className="w-full bg-[#E8192C] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#c8102e] transition-colors disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Saving…' : myReview ? 'Update Review' : 'Post Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Star size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    <a href="/login" className="text-[#E8192C] hover:underline">Sign in</a> to leave a review
                  </p>
                </div>
              )}

              {/* Reviews list */}
              {!reviewsLoaded ? (
                <div className="text-center py-6 text-gray-400 text-sm">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <StarRating value={review.rating} size={14} />
                        <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
                      </div>
                      {review.body && (
                        <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                      )}
                      <div className="h-px bg-gray-50" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
