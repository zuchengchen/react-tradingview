import { useState, useCallback, useMemo } from 'react'
import ChartContainer from '../ChartContainer'
import TradingViewChart from '../TradingViewChart'
import './index.scss'

interface DualChartLayoutProps {
  defaultSymbol?: string
  upperTimeframe?: string
  lowerTimeframe?: string
  theme?: 'light' | 'dark'
  enableCrosshairSync?: boolean
}

function getLocalLanguage(): string {
  return navigator.language.split('-')[0] || 'en'
}

export default function DualChartLayout({
  defaultSymbol = 'BTCUSDT',
  upperTimeframe: initialUpperTf = '60',
  lowerTimeframe: initialLowerTf = '15',
  theme = 'light',
  enableCrosshairSync,
}: DualChartLayoutProps) {
  const [symbol, setSymbol] = useState<string>(defaultSymbol)
  const [upperTimeframe, setUpperTimeframe] = useState<string>(initialUpperTf)
  const [lowerTimeframe, setLowerTimeframe] = useState<string>(initialLowerTf)

  const locale = useMemo(() => getLocalLanguage(), [])
  const timezone = useMemo(() => 
    Intl.DateTimeFormat().resolvedOptions().timeZone, 
    []
  )

  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (newSymbol && newSymbol !== symbol) {
      setSymbol(newSymbol)
    }
  }, [symbol])

  return (
    <div className={`dual-chart-layout ${theme}`}>
      <div className="chart-wrapper upper">
        <ChartContainer
          symbol={symbol}
          timeframe={upperTimeframe}
          onTimeframeChange={setUpperTimeframe}
          onSymbolChange={handleSymbolChange}
          theme={theme}
          position="upper"
          locale={locale}
          timezone={timezone}
          enableCrosshairSync={enableCrosshairSync}
        />
      </div>
      <div className="chart-wrapper lower">
        <ChartContainer
          symbol={symbol}
          timeframe={lowerTimeframe}
          onTimeframeChange={setLowerTimeframe}
          onSymbolChange={handleSymbolChange}
          theme={theme}
          position="lower"
          locale={locale}
          timezone={timezone}
          enableCrosshairSync={enableCrosshairSync}
        />
      </div>
    </div>
  )
}
