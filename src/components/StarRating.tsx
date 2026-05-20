interface StarRatingProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  size?: number
}

export default function StarRating({ value, max = 5, onChange, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          style={{ fontSize: size }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span style={{ color: star <= value ? '#E8192C' : '#D1D5DB' }}>★</span>
        </button>
      ))}
    </div>
  )
}
