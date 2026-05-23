import { useEffect, useState } from 'react'

interface ConnectionStatus {
  isOnline: boolean
  effectiveType: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getConn = () => (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection ?? null

export function useConnectionStatus(): ConnectionStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [effectiveType, setEffectiveType] = useState<string | null>(() => getConn()?.effectiveType ?? null)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const conn = getConn()
    const onNetChange = () => setEffectiveType(conn?.effectiveType ?? null)
    conn?.addEventListener('change', onNetChange)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      conn?.removeEventListener('change', onNetChange)
    }
  }, [])

  return { isOnline, effectiveType }
}
