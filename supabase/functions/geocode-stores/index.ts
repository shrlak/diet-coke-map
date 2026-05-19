import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOMINATIM_UA = 'DietCokeMap/1.0 (geocode-stores; contact via github.com/shrlak/diet-coke-map)'
const DELAY_MS = 1100 // Nominatim ToS: max 1 req/sec

interface Store {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  importance: number
}

async function geocode(store: Store): Promise<{ lat: number; lon: number; display: string } | null> {
  const q = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrySet=US`

  const res = await fetch(url, {
    headers: { 'User-Agent': NOMINATIM_UA },
  })

  if (!res.ok) return null

  const data: NominatimResult[] = await res.json()
  if (!data[0]) return null

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display: data[0].display_name,
  }
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, address, city, state, zip')
    .order('name')

  if (error || !stores) {
    return Response.json({ error: error?.message ?? 'Failed to fetch stores' }, { status: 500 })
  }

  const updated: { name: string; address: string; lat: number; lon: number }[] = []
  const failed: { name: string; address: string; reason: string }[] = []

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i] as Store

    try {
      const geo = await geocode(store)

      if (geo) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({ latitude: geo.lat, longitude: geo.lon })
          .eq('id', store.id)

        if (updateError) {
          failed.push({ name: store.name, address: `${store.address}, ${store.city}`, reason: updateError.message })
        } else {
          updated.push({ name: store.name, address: `${store.address}, ${store.city}`, lat: geo.lat, lon: geo.lon })
        }
      } else {
        failed.push({ name: store.name, address: `${store.address}, ${store.city}`, reason: 'No geocoding result' })
      }
    } catch (err) {
      failed.push({ name: store.name, address: `${store.address}, ${store.city}`, reason: String(err) })
    }

    // Rate limit: respect Nominatim's 1 req/sec policy
    if (i < stores.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  return Response.json({
    total: stores.length,
    updated: updated.length,
    failed: failed.length,
    updatedStores: updated,
    failedStores: failed,
  })
})
