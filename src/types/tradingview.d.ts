declare global {
  interface Window {
    TradingView: {
      widget: new (options: WidgetOptions) => TradingViewWidget
    }
  }
}

export interface WidgetOptions {
  container_id?: string
  container?: HTMLElement
  datafeed: Datafeed
  library_path: string
  locale?: string
  debug?: boolean
  symbol?: string
  interval?: string
  theme?: 'light' | 'dark'
  allow_symbol_change?: boolean
  timezone?: string
  autosize?: boolean
  disabled_features?: string[]
  enabled_features?: string[]
}

export interface TradingViewWidget {
  onChartReady(callback: () => void): void
  activeChart(): Chart
}

export interface Chart {
  onSymbolChanged(): any
}

export interface Datafeed {
  onReady(callback: (config: ResolutionInfo) => void): void
  searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: (items: SearchSymbolResult[]) => void
  ): void
  resolveSymbol(
    symbolName: string,
    onResolve: (symbol: SymbolInfo) => void,
    onError: (reason: string) => void
  ): void
  getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    from: number,
    to: number,
    onResult: (bars: Bar[], meta: { noData: boolean }) => void,
    onError: (reason: string) => void,
    firstDataRequest: boolean
  ): void
  subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onTick: (bar: Bar) => void,
    listenerGuid: string,
    onResetCacheNeededCallback?: () => void
  ): void
  unsubscribeBars(listenerGuid: string): void
}

export interface ResolutionInfo {
  supports_marks: boolean
  supports_timescale_marks: boolean
  supports_time: boolean
  supported_resolutions: string[]
}

export interface SearchSymbolResult {
  symbol: string
  full_name: string
  description: string
  ticker: string
  exchange: string
  type: string
}

export interface SymbolInfo {
  name: string
  description: string
  ticker: string
  exchange: string
  listed_exchange: string
  type: string
  session: string
  minmov: number
  pricescale: number
  has_intraday: boolean
  has_daily: boolean
  has_weekly_and_monthly: boolean
  currency_code: string
}

export interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime?: number
  openTime?: number
}

export interface ChartProperties {
  locale: string
  debug: boolean
  symbol: string
  interval: string
  theme: 'light' | 'dark'
  allow_symbol_change: boolean
  timezone: string
  autosize: boolean
}

export interface BinanceSymbol {
  symbol: string
  baseAsset: string
  quoteAsset: string
  filters: Array<{
    filterType: string
    tickSize?: string
  }>
}

export type Kline = [number, string, string, string, string, string, number]

export {}
