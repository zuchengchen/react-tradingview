import SocketClient from './socketClient'
import type { 
  Datafeed, 
  ResolutionInfo, 
  SearchSymbolResult, 
  SymbolInfo, 
  Bar, 
  BinanceSymbol, 
  Kline 
} from '../types/tradingview'

export default class BinanceAPI implements Datafeed {
  private binanceHost = 'https://api.binance.com'
  private debug: boolean
  private ws: SocketClient
  private symbols: BinanceSymbol[] = []

  constructor(options: { debug: boolean }) {
    this.debug = options.debug || false
    this.ws = new SocketClient()
  }

  private async binanceSymbols(): Promise<BinanceSymbol[]> {
    const res = await fetch(`${this.binanceHost}/api/v1/exchangeInfo`)
    const json = await res.json()
    return json.symbols
  }

  private async binanceKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<Kline[]> {
    const url = `${this.binanceHost}/api/v1/klines?symbol=${symbol}&interval=${interval}${startTime ? `&startTime=${startTime}` : ''}${endTime ? `&endTime=${endTime}` : ''}${limit ? `&limit=${limit}` : ''}`
    const res = await fetch(url)
    return res.json()
  }

  onReady(callback: (config: ResolutionInfo) => void): void {
    this.binanceSymbols()
      .then((symbols) => {
        this.symbols = symbols
        callback({
          supports_marks: false,
          supports_timescale_marks: false,
          supports_time: true,
          supported_resolutions: [
            '1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', '1D', '3D', '1W', '1M'
          ]
        })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  searchSymbols(
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResult: (items: SearchSymbolResult[]) => void
  ): void {
    const query = userInput.toUpperCase()
    onResult(
      this.symbols
        .filter((symbol) => symbol.symbol.includes(query))
        .map((symbol) => ({
          symbol: symbol.symbol,
          full_name: symbol.symbol,
          description: `${symbol.baseAsset} / ${symbol.quoteAsset}`,
          ticker: symbol.symbol,
          exchange: 'Binance',
          type: 'crypto'
        }))
    )
  }

  resolveSymbol(
    symbolName: string,
    onResolve: (symbol: SymbolInfo) => void,
    onError: (reason: string) => void
  ): void {
    if (this.debug) console.log('resolveSymbol:', symbolName)

    const comps = symbolName.split(':')
    const name = (comps.length > 1 ? comps[1] : symbolName).toUpperCase()

    const getPricescale = (symbol: BinanceSymbol): number => {
      for (const filter of symbol.filters) {
        if (filter.filterType === 'PRICE_FILTER' && filter.tickSize) {
          return Math.round(1 / parseFloat(filter.tickSize))
        }
      }
      return 1
    }

    const symbol = this.symbols.find((s) => s.symbol === name)
    if (symbol) {
      setTimeout(() => {
        onResolve({
          name: symbol.symbol,
          description: `${symbol.baseAsset} / ${symbol.quoteAsset}`,
          ticker: symbol.symbol,
          exchange: 'Binance',
          listed_exchange: 'Binance',
          type: 'crypto',
          session: '24x7',
          minmov: 1,
          pricescale: getPricescale(symbol),
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          currency_code: symbol.quoteAsset
        })
      }, 0)
    } else {
      onError('not found')
    }
  }

  getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    from: number,
    to: number,
    onResult: (bars: Bar[], meta: { noData: boolean }) => void,
    onError: (reason: string) => void,
    _firstDataRequest: boolean
  ): void {
    const interval = this.ws.tvIntervals[resolution]
    if (!interval) {
      onError('Invalid interval')
      return
    }

    const kLinesLimit = 500
    let totalKlines: Kline[] = []

    const finishKlines = () => {
      if (totalKlines.length === 0) {
        onResult([], { noData: true })
      } else {
        const historyCBArray: Bar[] = totalKlines.map((kline) => ({
          time: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        }))
        onResult(historyCBArray, { noData: false })
      }
    }

    const getKlines = async (fromMs: number, toMs: number) => {
      try {
        const data = await this.binanceKlines(symbolInfo.name, interval, fromMs, toMs, kLinesLimit)
        totalKlines = totalKlines.concat(data)
        if (data.length === kLinesLimit) {
          const newFrom = data[data.length - 1][0] + 1
          getKlines(newFrom, toMs)
        } else {
          finishKlines()
        }
      } catch (e) {
        console.error(e)
        onError('Error in getKlines')
      }
    }

    getKlines(from * 1000, to * 1000)
  }

  subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onTick: (bar: Bar) => void,
    listenerGuid: string,
    onResetCacheNeededCallback?: () => void
  ): void {
    this.ws.subscribeOnStream(symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeededCallback)
  }

  unsubscribeBars(listenerGuid: string): void {
    this.ws.unsubscribeFromStream(listenerGuid)
  }
}
