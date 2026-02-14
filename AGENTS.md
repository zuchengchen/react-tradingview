# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-11
**Commit:** 309d711
**Branch:** master

## OVERVIEW

React SPA integrating TradingView Charting Library with Binance REST/WebSocket APIs for real-time cryptocurrency charts. Create React App (ejected-style) with Express production server.

## STRUCTURE

```
.
├── src/
│   ├── index.js                 # React entry
│   ├── pages/Home/              # Single page (chart config)
│   ├── components/TradingViewChart/  # Widget wrapper
│   ├── services/                # api.js (datafeed), socketClient.js (WS)
│   └── assets/scss/             # Global styles + variables
├── public/
│   ├── scripts/charting_library/  # TradingView lib (NOT in repo)
│   └── index.html
└── server.js                    # Express static server (production)
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Chart options (symbol, interval, theme) | `src/pages/Home/index.js` → `cOptions` |
| TradingView widget initialization | `src/components/TradingViewChart/index.js` |
| Add new datafeed methods | `src/services/api.js` |
| WebSocket message handling | `src/services/socketClient.js` → `_ws.onmessage` |
| Supported resolutions | `src/services/api.js` → `onReady()` |
| Time interval mapping | `src/services/socketClient.js` → `tvIntervals` |
| Global styles | `src/assets/scss/global.scss` |
| SCSS variables | `src/assets/scss/variables.scss` |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Home` | Class Component | `src/pages/Home/index.js` | Main page, chart config |
| `TradingViewChart` | Class Component | `src/components/TradingViewChart/index.js` | Widget lifecycle |
| `binanceAPI` | Class | `src/services/api.js` | Datafeed implementation |
| `SocketClient` | Class | `src/services/socketClient.js` | WebSocket streaming |
| `cOptions` | Object | `src/pages/Home/index.js` | Chart configuration |
| `widgetOptions` | Object | `src/components/TradingViewChart/index.js` | Widget props |
| `tvIntervals` | Object | `src/services/socketClient.js` | TV→Binance interval map |

## CONVENTIONS

- **Class components**: Project uses React class components (no hooks)
- **Datafeed pattern**: `api.js` must implement TradingView Datafeed interface:
  - `onReady(callback)`
  - `searchSymbols(userInput, exchange, symbolType, onResultReadyCallback)`
  - `resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback)`
  - `getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest)`
  - `subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback)`
  - `unsubscribeBars(subscriberUID)`
- **WebSocket pattern**: Single connection, multi-stream via `streams` object keyed by symbol

## ANTI-PATTERNS

- **DO NOT** rename datafeed methods in `api.js` — TradingView expects exact names
- **DO NOT** commit `public/scripts/charting_library/` — proprietary, not in repo
- `localStorage.setItem("wsStatus", ...)` used for WS state — avoid adding more localStorage keys

## UNIQUE STYLES

- Debug logging: `this.debug && console.log(...)` pattern in `api.js`
- Symbol resolution uses `setTimeout(() => callback, 0)` to ensure async behavior
- Kline data pagination via recursive `getKlines()` with 500 limit

## COMMANDS

```bash
# Development (requires charting_library in public/scripts/)
yarn serve           # CRA dev server

# Production
yarn build           # Build to build/
yarn start           # Serve build/ via Express (port 3000)

# Deployment
yarn heroku          # Build + push to Heroku
```

## NOTES

- **TradingView library**: Must obtain separately and place in `public/scripts/charting_library/`
- **No tests**: Project has no test files configured
- **No lint config**: ESLint was removed (commit `ac89a6f`)
- **React 17**: Uses legacy ReactDOM.render (not createRoot)
- **Binance API**: REST at `api.binance.com`, WS at `stream.binance.com:9443/ws`
