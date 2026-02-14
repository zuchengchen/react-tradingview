import { useEffect, useRef, useCallback, useMemo } from 'react'
import BinanceAPI from '../../services/api'
import type { ChartProperties, TradingViewWidget } from '../../types/tradingview'
import './index.scss'

interface TradingViewChartProps {
  chartProperties: ChartProperties
  onWidgetReady?: (widget: TradingViewWidget) => void
  onSymbolChange?: (symbol: string) => void
}

export default function TradingViewChart({
  chartProperties,
  onWidgetReady,
  onSymbolChange
}: TradingViewChartProps) {
  const containerId = useMemo(() => {
    return `chart_container_${Math.random().toString(36).substring(2, 9)}`
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<TradingViewWidget | null>(null)
  const apiRef = useRef<BinanceAPI | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const TradingViewLib = (window as any).TradingView
    if (typeof TradingViewLib === 'undefined') {
      console.error('TradingView library not loaded')
      return
    }

    apiRef.current = new BinanceAPI({ debug: false })

    console.log('Initializing TradingView widget...', chartProperties)

    try {
      widgetRef.current = new TradingViewLib.widget({
        container_id: containerId,
        datafeed: apiRef.current,
        library_path: '/scripts/charting_library/',
        disabled_features: ['timeframes_toolbar', 'header_undo_redo'],
        ...chartProperties
      })

      console.log('Widget created')

      widgetRef.current?.onChartReady(() => {
        console.log('Chart ready')
        const activeChart = widgetRef.current?.activeChart()

        if (onWidgetReady && widgetRef.current) {
          onWidgetReady(widgetRef.current)
        }

        if (onSymbolChange && activeChart) {
          // @ts-ignore - TradingView Chart API
          activeChart.onSymbolChanged().subscribe(null, (symbolInfo: any) => {
            const newSymbol = symbolInfo?.name
            if (newSymbol) {
              onSymbolChange(newSymbol)
            }
          })
        }
      })
    } catch (error) {
      console.error('Error creating TradingView widget:', error)
    }

    const cleanup = () => {
      if (apiRef.current) {
        apiRef.current = null
      }
    }

    return cleanup
  }, [chartProperties, onWidgetReady, onSymbolChange])

  return <div id={containerId} ref={containerRef}></div>
}
