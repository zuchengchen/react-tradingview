import { useMemo } from 'react'
import './index.scss'

interface TimeframeSelectorProps {
  value: string
  onChange: (tf: string) => void
}

const TIMEFRAME_OPTIONS = [
  { value: '1', label: '1m' },
  { value: '3', label: '3m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1H' },
  { value: '120', label: '2H' },
  { value: '240', label: '4H' },
  { value: '360', label: '6H' },
  { value: '480', label: '8H' },
  { value: '720', label: '12H' },
  { value: '1D', label: '1D' },
  { value: '3D', label: '3D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
]

export default function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const selectedLabel = useMemo(() => {
    const option = TIMEFRAME_OPTIONS.find(opt => opt.value === value)
    return option?.label || value
  }, [value])

  return (
    <select
      className="timeframe-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Select timeframe"
    >
      {TIMEFRAME_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
