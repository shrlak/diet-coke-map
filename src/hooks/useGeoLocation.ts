import { useCallback, useEffect, useState } from 'react'
import { UserLocation } from '../types'

interface UseGeoLocationState {
  location: UserLocation | null
  loading: boolean
  error: string | null
  requestLocation: () => void
}

export const useGeoLocation = (): UseGeoLocationState => {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setLocation({ latitude, longitude, accuracy })
        setLoading(false)
      },
      (err) => {
        let errorMessage = 'Unable to retrieve your location'
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable it in your browser settings.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.'
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'The request to get user location timed out.'
        }
        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    // Try to get location on mount
    requestLocation()
  }, [requestLocation])

  return {
    location,
    loading,
    error,
    requestLocation,
  }
}
