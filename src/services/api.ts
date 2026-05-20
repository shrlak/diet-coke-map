import { createClient } from '@supabase/supabase-js'
import { Store, SearchFilters, StoreProduct, FavoriteStore, StoreReview, StoreSubmission, StockConfirmationSummary } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Auth helpers
export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
  return { data, error }
}

export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  return { data, error }
}

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { data, error }
}

// Store data
export const getStores = async (filters?: SearchFilters) => {
  try {
    let query = supabase
      .from('stores')
      .select(
        '*, store_hours(*), store_products(*, products(*))'
      )
      .eq('is_active', true)

    if (filters?.storeType) {
      query = query.eq('store_type', filters.storeType)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: (data as Store[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching stores:', error)
    return { data: [], error }
  }
}

export const getStoreById = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*, store_hours(*), store_products(*, products(*))')
      .eq('id', storeId)
      .single()

    if (error) throw error
    return { data: (data as Store) || null, error: null }
  } catch (error) {
    console.error('Error fetching store:', error)
    return { data: null, error }
  }
}

export const searchStoresByLocation = async (query: string) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*, store_hours(*), store_products(*, products(*))')
      .eq('is_active', true)
      .or(
        `address.ilike.%${query}%,city.ilike.%${query}%,zip.eq.${query}`
      )

    if (error) throw error
    return { data: (data as Store[]) || [], error: null }
  } catch (error) {
    console.error('Error searching stores:', error)
    return { data: [], error }
  }
}

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180

export const getStoresNearby = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 25
) => {
  try {
    const { data, error } = await supabase
      .rpc('nearby_stores', {
        user_lat: latitude,
        user_lon: longitude,
        radius_km: radiusKm,
      })

    if (error) throw error
    return { data: (data as Store[]) || [], error: null }
  } catch (error) {
    console.warn('PostGIS nearby_stores RPC not available, falling back to client-side filtering')
    const { data: allStores } = await getStores()

    const filtered = allStores.filter(store => {
      const distance = calculateDistance(
        latitude,
        longitude,
        store.latitude,
        store.longitude
      )
      return distance <= radiusKm
    })

    return { data: filtered, error: null }
  }
}

export const getFavoriteStores = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorite_stores')
      .select('*, stores(*)')
      .eq('user_id', userId)

    if (error) throw error
    return { data: (data as FavoriteStore[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return { data: [], error }
  }
}

export const addToFavorites = async (userId: string, storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorite_stores')
      .insert({ user_id: userId, store_id: storeId })
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding favorite:', error)
    return { data: null, error }
  }
}

export const removeFromFavorites = async (userId: string, storeId: string) => {
  try {
    const { error } = await supabase
      .from('favorite_stores')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error removing favorite:', error)
    return { error }
  }
}

export const isFavorited = async (userId: string, storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorite_stores')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single()

    if (error?.code === 'PGRST116') return { isFavorited: false, error: null }
    if (error) throw error

    return { isFavorited: !!data, error: null }
  } catch (error) {
    console.error('Error checking favorite:', error)
    return { isFavorited: false, error }
  }
}

export const getStoreHours = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_hours')
      .select('*')
      .eq('store_id', storeId)
      .order('day_of_week')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching store hours:', error)
    return { data: [], error }
  }
}

export const isStoreOpenNow = async (storeId: string): Promise<boolean> => {
  try {
    const { data: hours } = await getStoreHours(storeId)

    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5)

    const todayHours = hours.find(h => h.day_of_week === dayOfWeek)

    if (!todayHours || todayHours.is_closed) {
      return false
    }

    return currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
  } catch (error) {
    console.error('Error checking if store is open:', error)
    return false
  }
}

export const getStoreProducts = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_products')
      .select('*, products(*)')
      .eq('store_id', storeId)
      .eq('in_stock', true)

    if (error) throw error
    return { data: (data as StoreProduct[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching store products:', error)
    return { data: [], error }
  }
}

// ── Stock confirmations ──────────────────────────────────────────────────────

export const getStockConfirmationSummary = async (
  storeProductId: string
): Promise<StockConfirmationSummary> => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('stock_confirmations')
    .select('is_confirmed, created_at')
    .eq('store_product_id', storeProductId)
    .gte('created_at', since)

  if (!data) return { confirmed: 0, denied: 0, lastConfirmedAt: null }
  const confirmed = data.filter((r) => r.is_confirmed).length
  const denied = data.filter((r) => !r.is_confirmed).length
  const confirmRows = data.filter((r) => r.is_confirmed)
  const lastConfirmedAt =
    confirmRows.length > 0
      ? confirmRows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
      : null
  return { confirmed, denied, lastConfirmedAt }
}

export const addStockConfirmation = async (
  storeProductId: string,
  isConfirmed: boolean,
  userId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('stock_confirmations')
      .insert({ store_product_id: storeProductId, is_confirmed: isConfirmed, user_id: userId ?? null })
      .select()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding stock confirmation:', error)
    return { data: null, error }
  }
}

// ── Stock alerts ─────────────────────────────────────────────────────────────

export const getStockAlerts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return { data: [], error }
  }
}

export const addStockAlert = async (userId: string, storeId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('stock_alerts')
      .insert({ user_id: userId, store_id: storeId, product_id: productId })
      .select()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding stock alert:', error)
    return { data: null, error }
  }
}

export const removeStockAlert = async (userId: string, storeId: string, productId: string) => {
  try {
    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('product_id', productId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error removing stock alert:', error)
    return { error }
  }
}

// ── Store reviews ─────────────────────────────────────────────────────────────

export const getStoreReviews = async (storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: (data as StoreReview[]) || [], error: null }
  } catch (error) {
    console.error('Error fetching store reviews:', error)
    return { data: [], error }
  }
}

export const getMyReview = async (userId: string, storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single()
    if (error?.code === 'PGRST116') return { data: null, error: null }
    if (error) throw error
    return { data: data as StoreReview, error: null }
  } catch (error) {
    console.error('Error fetching own review:', error)
    return { data: null, error }
  }
}

export const upsertStoreReview = async (
  userId: string,
  storeId: string,
  rating: number,
  body?: string
) => {
  try {
    const { data, error } = await supabase
      .from('store_reviews')
      .upsert(
        { user_id: userId, store_id: storeId, rating, body: body ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,store_id' }
      )
      .select()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error upserting review:', error)
    return { data: null, error }
  }
}

export const deleteStoreReview = async (reviewId: string) => {
  try {
    const { error } = await supabase.from('store_reviews').delete().eq('id', reviewId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { error }
  }
}

// ── Store submissions ─────────────────────────────────────────────────────────

export const submitStore = async (submission: StoreSubmission) => {
  try {
    const { data, error } = await supabase
      .from('store_submissions')
      .insert(submission)
      .select()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error submitting store:', error)
    return { data: null, error }
  }
}

// ── Store ratings (aggregate view) ───────────────────────────────────────────

export interface StoreRatingSummary {
  store_id: string
  avg_rating: number
  review_count: number
}

export const getAllStoreRatings = async (): Promise<Record<string, StoreRatingSummary>> => {
  try {
    const { data, error } = await supabase.from('store_avg_ratings').select('*')
    if (error) throw error
    const map: Record<string, StoreRatingSummary> = {}
    for (const row of data ?? []) {
      map[row.store_id] = {
        store_id: row.store_id,
        avg_rating: Number(row.avg_rating),
        review_count: Number(row.review_count),
      }
    }
    return map
  } catch {
    return {}
  }
}

// ── Store check-ins ───────────────────────────────────────────────────────────

export const addCheckin = async (userId: string, storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_checkins')
      .insert({ user_id: userId, store_id: storeId })
      .select()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding check-in:', error)
    return { data: null, error }
  }
}

export const getRecentCheckinCount = async (storeId: string): Promise<number> => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error } = await supabase
      .from('store_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', since)
    if (error) throw error
    return count ?? 0
  } catch {
    return 0
  }
}

export const getMyLastCheckin = async (userId: string, storeId: string) => {
  try {
    const { data, error } = await supabase
      .from('store_checkins')
      .select('created_at')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error?.code === 'PGRST116') return { data: null, error: null }
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ── Enriched stock alerts (with store + product names) ───────────────────────

export interface EnrichedStockAlert {
  id: string
  user_id: string
  store_id: string
  product_id: string
  created_at: string
  store_name: string
  store_address: string
  product_name: string
  in_stock: boolean
}

export const getEnrichedStockAlerts = async (userId: string): Promise<EnrichedStockAlert[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select(`
        id, user_id, store_id, product_id, created_at,
        stores(name, address),
        products(name),
        store_products!inner(in_stock)
      `)
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      store_id: row.store_id,
      product_id: row.product_id,
      created_at: row.created_at,
      store_name: row.stores?.name ?? '',
      store_address: row.stores?.address ?? '',
      product_name: row.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '') ?? '',
      in_stock: row.store_products?.[0]?.in_stock ?? false,
    }))
  } catch (error) {
    console.error('Error fetching enriched alerts:', error)
    return []
  }
}

export const getAlertNotifications = async (userId: string): Promise<EnrichedStockAlert[]> => {
  const alerts = await getEnrichedStockAlerts(userId)
  return alerts.filter((a) => a.in_stock)
}
