// User types
export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

// Store types
export interface Store {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  latitude: number
  longitude: number
  phone?: string
  store_type?: string
  is_active: boolean
  created_at: string
  updated_at: string
  store_hours?: StoreHours[]
  store_products?: StoreProduct[]
}

export interface StoreHours {
  id: string
  store_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  opens_at: string // HH:MM format
  closes_at: string // HH:MM format
  is_closed: boolean
  special_note?: string
}

// Product types
export interface Product {
  id: string
  name: string
  category: 'bottle' | 'fountain' | 'can' | 'pack'
  volume_ml?: number
  sku?: string
}

export interface StoreProduct {
  id: string
  store_id: string
  product_id: string
  in_stock: boolean
  last_verified_at: string
  products?: Product
}

// Favorite types
export interface FavoriteStore {
  id: string
  user_id: string
  store_id: string
  created_at: string
  stores?: Store
}

// Search & Filter types
export interface SearchFilters {
  latitude?: number
  longitude?: number
  radiusKm?: number
  productIds?: string[]
  storeType?: string
  isOpenNow?: boolean
}

export interface SearchResult {
  stores: Store[]
  totalCount: number
  hasMore: boolean
}

// Location type
export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

// Stock confirmation (crowdsourced)
export interface StockConfirmation {
  id: string
  store_product_id: string
  user_id: string | null
  is_confirmed: boolean
  created_at: string
}

export interface StockConfirmationSummary {
  confirmed: number
  denied: number
  lastConfirmedAt: string | null
}

// Stock alerts
export interface StockAlert {
  id: string
  user_id: string
  store_id: string
  product_id: string
  created_at: string
}

// Store reviews
export interface StoreReview {
  id: string
  user_id: string
  store_id: string
  rating: number
  body?: string
  created_at: string
  updated_at: string
  reviewer_name?: string
}

// Store submissions
export interface StoreSubmission {
  submitter_email?: string
  name: string
  address: string
  city: string
  state: string
  zip?: string
  store_type?: string
  notes?: string
}

// Route planner
export interface RouteStop {
  store: Store
  addedAt: number
}
