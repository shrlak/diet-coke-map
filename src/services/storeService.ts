import { supabase } from './supabase'
import { Store, SearchFilters, StoreProduct, FavoriteStore } from '../types'

// Fetch all stores with optional filters
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

// Fetch single store by ID
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

// Search stores by address/city/zip
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

// Get stores within radius of coordinates
// Note: This requires PostGIS function setup in Supabase
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
    // Fallback if RPC not available - fetch all and filter in frontend
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

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
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

// Get favorite stores for current user
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

// Add store to favorites
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

// Remove store from favorites
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

// Check if store is favorited
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

// Get store hours for a specific day
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

// Check if store is open now
export const isStoreOpenNow = async (storeId: string): Promise<boolean> => {
  try {
    const { data: hours } = await getStoreHours(storeId)

    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM

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

// Get products available at a store
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
