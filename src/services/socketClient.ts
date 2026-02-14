import type { SymbolInfo, Bar } from '../types/tradingview'

interface Stream {
  paramStr: string
  data?: Bar
  listener: (bar: Bar) => void
}

interface KlineMessage {
  s: string
  E: number
  k: {
    o: string
    h: string
    l: string
    v: string
    c: string
    T: number
    t: number
  }
}

export default class SocketClient {
  private baseUrl = 'wss://stream.binance.com:9443/ws'
  private _ws: WebSocket
  tvIntervals: Record<string, string> = {
    '1': '1m',
    '3': '3m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '120': '2h',
    '240': '4h',
    '360': '6h',
    '480': '8h',
    '720': '12h',
    'D': '1d',
    '1D': '1d',
    '3D': '3d',
    'W': '1w',
    '1W': '1w',
    'M': '1M',
    '1M': '1M',
  }
  streams: Record<string, Stream> = {}

  constructor() {
    this._ws = this._createSocket()
  }

  private _createSocket(): WebSocket {
    const ws = new WebSocket(this.baseUrl)
    
    ws.onopen = () => {
      console.info('Binance WS Open')
      localStorage.setItem('wsStatus', '1')
    }

    ws.onclose = () => {
      console.warn('Binance WS Closed')
      localStorage.setItem('wsStatus', '0')
    }

    ws.onerror = (err) => {
      console.warn('WS Error', err)
      localStorage.setItem('wsStatus', '0')
    }

    ws.onmessage = (msg) => {
      if (!msg?.data) return
      const sData: KlineMessage = JSON.parse(msg.data)
      try {
        if (sData && sData.k) {
          const { s } = sData
          const { o, h, l, v, c, T, t } = sData.k
          const lastSocketData: Bar = {
            time: t,
            close: parseFloat(c),
            open: parseFloat(o),
            high: parseFloat(h),
            low: parseFloat(l),
            volume: parseFloat(v),
            closeTime: T,
            openTime: t,
          }
          if (Object.keys(this.streams).length && this.streams[s]) {
            this.streams[s].data = lastSocketData
            this.streams[s].listener(lastSocketData)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    return ws
  }

  subscribeOnStream(
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    _subscriberUID: string,
    _onResetCacheNeededCallback?: () => void
  ) {
    try {
      const paramStr = `${symbolInfo.name.toLowerCase()}@kline_${this.tvIntervals[resolution]}`
      const obj = {
        method: 'SUBSCRIBE',
        params: [paramStr],
        id: 1,
      }
      if (this._ws.readyState === 1) {
        this._ws.send(JSON.stringify(obj))
        this.streams[symbolInfo.name] = {
          paramStr,
          listener: onRealtimeCallback,
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  unsubscribeFromStream(subscriberUID: string) {
    try {
      const id = subscriberUID.split('_')[0]
      const obj = {
        method: 'UNSUBSCRIBE',
        params: [this.streams[id].paramStr],
        id: 1,
      }
      delete this.streams[id]
      if (this._ws.readyState === 1) {
        this._ws.send(JSON.stringify(obj))
      }
    } catch (e) {
      console.error(e)
    }
  }
}
