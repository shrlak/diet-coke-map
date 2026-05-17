import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserLocation } from '../types'

interface UseGeoLocationState {
  location: UserLocation | null
  loading: boolean
  error: string | null
  isWatching: boolean
  requestLocation: () => void
  startWatching: () => void
  stopWatching: () => void
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
}

export const useGeoLocation = (): UseGeoLocationState => {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    setLocation({ latitude, longitude, accuracy })
    setLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
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
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS)
  }, [handleSuccess, handleError])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    if (watchIdRef.current !== null) return
    setLoading(true)
    setError(null)
    setIsWatching(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      WATCH_OPTIONS,
    )
  }, [handleSuccess, handleError])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsWatching(false)
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { location, loading, error, isWatching, requestLocation, startWatching, stopWatching }
}
