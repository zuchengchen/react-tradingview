import { useRef, useMemo } from 'react'
import TradingViewChart from '../TradingViewChart'
import TimeframeSelector from '../TimeframeSelector'
import type { ChartProperties, TradingViewWidget } from '../../types/tradingview'
import './index.scss'

interface ChartContainerProps {
  symbol: string
  timeframe: string
  onTimeframeChange: (tf: string) => void
  onSymbolChange?: (symbol: string) => void
  theme: 'light' | 'dark'
  position: 'upper' | 'lower'
  locale: string
  timezone: string
  enableCrosshairSync?: boolean
}

export default function ChartContainer({
  symbol,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  theme,
  position,
  locale,
  timezone,
  enableCrosshairSync,
}: ChartContainerProps) {
  const widgetRef = useRef<TradingViewWidget | null>(null)

  const chartProperties: ChartProperties = useMemo(() => ({
    locale,
    debug: false,
    symbol,
    interval: timeframe,
    theme,
    allow_symbol_change: true,
    timezone,
    autosize: true,
  }), [locale, symbol, timeframe, theme, timezone])

  return (
    <div className={`chart-container ${position}`}>
      <div className="chart-header">
        <span className="chart-label">{position === 'upper' ? 'Main' : 'Lower'}</span>
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
      </div>
      <div className="chart-body">
        <TradingViewChart 
          chartProperties={chartProperties}
          onWidgetReady={(widget) => {
            widgetRef.current = widget
          }}
          onSymbolChange={onSymbolChange}
        />
      </div>
    </div>
  )
}
