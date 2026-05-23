import { Wifi, WifiOff, LocateFixed, Locate, LocateOff, Signal } from 'lucide-react'
import { useConnectionStatus } from '../hooks/useConnectionStatus'

type GpsState = 'inactive' | 'acquiring' | 'active' | 'error'

interface ConnectionStatusProps {
  gpsHasLocation: boolean
  gpsLoading: boolean
  gpsError: string | null
  onRequestGps?: () => void
}

const NET_LABEL: Record<string, string> = {
  'slow-2g': '2G',
  '2g': '2G',
  '3g': '3G',
  '4g': '4G',
}

export default function ConnectionStatus({ gpsHasLocation, gpsLoading, gpsError, onRequestGps }: ConnectionStatusProps) {
  const { isOnline, effectiveType } = useConnectionStatus()

  const gpsState: GpsState = gpsLoading
    ? 'acquiring'
    : gpsError
    ? 'error'
    : gpsHasLocation
    ? 'active'
    : 'inactive'

  const netLabel = effectiveType ? (NET_LABEL[effectiveType] ?? effectiveType.toUpperCase()) : isOnline ? '—' : '—'

  return (
    <div className="flex items-stretch bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Online / Offline */}
      <div className={`flex flex-col items-center justify-center gap-1.5 px-5 py-3.5 ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
        {isOnline
          ? <Wifi size={26} className="text-green-600" strokeWidth={2} />
          : <WifiOff size={26} className="text-red-500" strokeWidth={2} />}
        <span className={`text-[11px] font-bold tracking-wide uppercase ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="w-px bg-gray-200" />

      {/* GPS */}
      <button
        onClick={gpsState === 'inactive' || gpsState === 'error' ? onRequestGps : undefined}
        title={
          gpsState === 'active' ? 'GPS location active' :
          gpsState === 'acquiring' ? 'Acquiring GPS…' :
          gpsState === 'error' ? `GPS error — tap to retry: ${gpsError}` :
          'Tap to enable GPS'
        }
        className={`flex flex-col items-center justify-center gap-1.5 px-5 py-3.5 transition-colors ${
          gpsState === 'active'     ? 'bg-blue-50' :
          gpsState === 'acquiring'  ? 'bg-amber-50' :
          gpsState === 'error'      ? 'bg-orange-50 hover:bg-orange-100 cursor-pointer' :
                                      'bg-gray-50 hover:bg-gray-100 cursor-pointer'
        }`}
      >
        {gpsState === 'active'    ? <LocateFixed size={26} className="text-blue-600" strokeWidth={2} /> :
         gpsState === 'acquiring' ? <Locate size={26} className="text-amber-500 animate-pulse" strokeWidth={2} /> :
         gpsState === 'error'     ? <LocateOff size={26} className="text-orange-500" strokeWidth={2} /> :
                                    <LocateOff size={26} className="text-gray-400" strokeWidth={2} />}
        <span className={`text-[11px] font-bold tracking-wide uppercase ${
          gpsState === 'active'    ? 'text-blue-700' :
          gpsState === 'acquiring' ? 'text-amber-600' :
          gpsState === 'error'     ? 'text-orange-600' :
                                     'text-gray-400'
        }`}>
          {gpsState === 'active'    ? 'GPS On' :
           gpsState === 'acquiring' ? 'Finding' :
           gpsState === 'error'     ? 'GPS Off' :
                                      'No GPS'}
        </span>
      </button>

      <div className="w-px bg-gray-200" />

      {/* Network type */}
      <div className={`flex flex-col items-center justify-center gap-1.5 px-5 py-3.5 ${isOnline ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <Signal size={26} className={isOnline ? 'text-indigo-600' : 'text-gray-400'} strokeWidth={2} />
        <span className={`text-[11px] font-bold tracking-wide uppercase ${isOnline ? 'text-indigo-700' : 'text-gray-400'}`}>
          {isOnline ? netLabel : 'No net'}
        </span>
      </div>
    </div>
  )
}
