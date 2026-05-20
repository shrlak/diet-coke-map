import type { StoreHours } from '../types'

export function isOpenNow(hours: StoreHours[] | undefined): boolean {
  if (!hours || hours.length === 0) return false
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)
  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  return currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
}

export function openStatusLabel(hours: StoreHours[] | undefined): { isOpen: boolean; label: string } {
  if (!hours || hours.length === 0) return { isOpen: false, label: 'Hours unavailable' }
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)
  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return { isOpen: false, label: 'Closed today' }
  const open = currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
  if (open) return { isOpen: true, label: `Open until ${fmtTime(todayHours.closes_at)}` }
  if (currentTime < todayHours.opens_at) return { isOpen: false, label: `Opens at ${fmtTime(todayHours.opens_at)}` }
  return { isOpen: false, label: 'Closed for today' }
}

function fmtTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}${m === 0 ? '' : `:${String(m).padStart(2, '0')}`} ${period}`
}
