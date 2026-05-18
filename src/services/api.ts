import { createClient } from '@supabase/supabase-js'
import { Store, SearchFilters, StoreProduct, FavoriteStore } from '../types'

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
