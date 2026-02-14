# Dual-Chart Multi-Timeframe Layout Design

**Created:** 2026-02-14  
**Goal:** Add a vertical dual-chart layout for multi-timeframe analysis with synced symbols and configurable timeframes

## Overview

### Feature Summary
Display two TradingView charts stacked vertically, showing the same cryptocurrency pair at different timeframes. Users can configure each chart's timeframe independently while the symbol stays synced between both charts.

### Success Criteria
- Two charts render correctly in vertical layout
- Symbol changes sync across both charts
- Each chart's timeframe can be changed independently
- Layout is responsive and charts resize properly
- No performance degradation with two datafeeds

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────┐
│          Home (Page)            │
│  ┌───────────────────────────┐  │
│  │  DualChartLayout          │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ Chart 1 (upper)     │  │  │
│  │  │ e.g., 1H timeframe  │  │  │
│  │  └─────────────────────┘  │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ Chart 2 (lower)     │  │  │
│  │  │ e.g., 15M timeframe │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Symbol sync | Default synced | Most common use case for multi-timeframe analysis |
| Timeframe config | Independent per chart | Users need flexibility to compare any timeframes |
| Datafeed instances | One per chart | TradingView widgets require separate datafeed instances |
| State location | DualChartLayout component | Centralized control makes sync easier |

---

## Component Structure

### New Components

#### 1. DualChartLayout
Main orchestrator component that manages shared state.

```tsx
// src/components/DualChartLayout/index.tsx
interface DualChartLayoutProps {
  defaultSymbol: string
  upperTimeframe: string    // e.g., '60' for 1H
  lowerTimeframe: string    // e.g., '15' for 15M
  theme: 'light' | 'dark'
}

export default function DualChartLayout({
  defaultSymbol,
  upperTimeframe,
  lowerTimeframe,
  theme
}: DualChartLayoutProps)
```

**Responsibilities:**
- Manage shared symbol state
- Distribute timeframe config to each chart
- Handle layout/responsiveness
- Pass theme settings

#### 2. ChartContainer
Wrapper around TradingViewChart with timeframe controls.

```tsx
// src/components/ChartContainer/index.tsx
interface ChartContainerProps {
  symbol: string
  timeframe: string
  onTimeframeChange: (tf: string) => void
  theme: 'light' | 'dark'
  position: 'upper' | 'lower'
}

export default function ChartContainer({
  symbol,
  timeframe,
  onTimeframeChange,
  theme,
  position
}: ChartContainerProps)
```

**Responsibilities:**
- Render TradingViewChart with correct props
- Display timeframe selector dropdown
- Show position label (optional)
- Handle chart-specific styling

#### 3. TimeframeSelector
Simple dropdown for timeframe selection.

```tsx
// src/components/TimeframeSelector/index.tsx
interface TimeframeSelectorProps {
  value: string
  onChange: (tf: string) => void
  options: string[]  // ['1', '5', '15', '30', '60', '240', '1D']
}

export default function TimeframeSelector({
  value,
  onChange,
  options
}: TimeframeSelectorProps)
```

**Responsibilities:**
- Render dropdown with available timeframes
- Call onChange when user selects new timeframe
- Format labels (e.g., '60' → '1H')

### Modified Components

#### TradingViewChart
No major changes needed. Already accepts `chartProperties` which includes symbol and interval.

```tsx
// No changes required - already accepts symbol and interval via chartProperties
interface TradingViewChartProps {
  chartProperties: ChartProperties  // includes symbol, interval, theme
}
```

#### Home
Switch from single chart to dual chart layout.

```tsx
// Before: Single chart
<TradingViewChart chartProperties={cOptions} />

// After: Dual chart layout
<DualChartLayout
  defaultSymbol="BTCUSDT"
  upperTimeframe="60"
  lowerTimeframe="15"
  theme="light"
/>
```

---

## State Management

### State Location
All shared state lives in `DualChartLayout`. Child components receive props only.

### State Shape

```tsx
// Inside DualChartLayout
const [symbol, setSymbol] = useState<string>('BTCUSDT')
const [upperTimeframe, setUpperTimeframe] = useState<string>('60')
const [lowerTimeframe, setLowerTimeframe] = useState<string>('15')
```

### Symbol Sync Implementation

When user changes symbol on either chart, both update:

```tsx
// TradingView widget exposes onSymbolChanged callback
// We hook into this to sync symbols

const handleSymbolChange = useCallback((newSymbol: string) => {
  setSymbol(newSymbol)
  // Both charts will re-render with new symbol
}, [])
```

**Technical Note:** TradingView widget fires `onSymbolChanged` event. We'll need to:
1. Listen to this event on both widgets
2. Update shared `symbol` state
3. Pass updated symbol to both charts via props

### Timeframe Independence

Each chart manages its own timeframe locally within `DualChartLayout`:

```tsx
// Each chart's timeframe is independent
<DualChartLayout>
  <ChartContainer 
    timeframe={upperTimeframe}
    onTimeframeChange={setUpperTimeframe}
  />
  <ChartContainer 
    timeframe={lowerTimeframe}
    onTimeframeChange={setLowerTimeframe}
  />
</DualChartLayout>
```

---

## Data Flow

### Chart Initialization

```
1. DualChartLayout mounts
   ├── Initialize symbol = 'BTCUSDT'
   ├── Initialize upperTimeframe = '60'
   └── Initialize lowerTimeframe = '15'

2. ChartContainer (upper) mounts
   ├── Creates BinanceAPI instance
   ├── TradingView widget initializes with symbol + timeframe
   └── Widget calls datafeed.onReady()

3. ChartContainer (lower) mounts
   ├── Creates BinanceAPI instance
   ├── TradingView widget initializes with symbol + timeframe
   └── Widget calls datafeed.onReady()
```

### Symbol Change Flow

```
User clicks symbol selector on Chart 1
   ↓
TradingView widget fires onSymbolChanged
   ↓
ChartContainer calls onSymbolChange prop
   ↓
DualChartLayout updates symbol state
   ↓
React re-renders both ChartContainers with new symbol
   ↓
Both TradingViewCharts receive new chartProperties.symbol
   ↓
useEffect detects change, re-initializes widgets with new symbol
```

**Important:** Each widget's datafeed maintains its own WebSocket subscription. When symbol changes:
1. Old subscription is cleaned up (via `unsubscribeBars`)
2. New subscription is created for new symbol

### Timeframe Change Flow

```
User selects new timeframe in TimeframeSelector
   ↓
onChange callback fires
   ↓
ChartContainer calls onTimeframeChange prop
   ↓
DualChartLayout updates upperTimeframe or lowerTimeframe
   ↓
Only that ChartContainer re-renders
   ↓
TradingViewChart receives new chartProperties.interval
   ↓
useEffect detects change, widget reloads with new timeframe
```

---

## Error Handling

### Chart Load Failure
- Each ChartContainer catches initialization errors
- Display fallback message with retry button
- One chart failure doesn't affect the other

### WebSocket Disconnection
- Already handled in `socketClient.ts` with reconnection logic
- Each chart's datafeed handles its own reconnection
- Status displayed per chart (optional)

### Invalid Symbol
- TradingView calls `onError` callback from `resolveSymbol`
- Display error message in the affected chart only
- User can search for valid symbol

---

## File Structure

```
src/
├── components/
│   ├── DualChartLayout/
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── ChartContainer/
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── TimeframeSelector/
│   │   ├── index.tsx
│   │   └── index.scss
│   └── TradingViewChart/
│       └── index.tsx          # No changes
├── pages/
│   └── Home/
│       └── index.tsx          # Modified to use DualChartLayout
└── types/
    └── tradingview.d.ts       # May need small additions
```

---

## Styling

### Layout CSS

```scss
// DualChartLayout/index.scss
.dual-chart-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  gap: 4px;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;  // Important for flex children
  
  &.upper {
    // Upper chart gets slightly more space
    flex: 1.2;
  }
  
  &.lower {
    flex: 1;
  }
}
```

### ChartContainer CSS

```scss
// ChartContainer/index.scss
.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  
  .chart-body {
    flex: 1;
    position: relative;
  }
}
```

---

## Implementation Phases

### Phase 1: Basic Structure (30 min)
- Create DualChartLayout component
- Render two TradingViewCharts vertically
- Hardcoded symbol and timeframes
- Verify both charts load

### Phase 2: State Management (30 min)
- Add symbol sync logic
- Hook into TradingView's onSymbolChanged
- Verify symbol changes propagate

### Phase 3: Timeframe Controls (20 min)
- Create TimeframeSelector component
- Add to ChartContainer
- Wire up timeframe change handlers

### Phase 4: Polish (20 min)
- Final styling
- Responsive adjustments
- Error handling refinement

**Total Estimated Time: ~1.5-2 hours**

---

## Testing Checklist

- [ ] Both charts render on initial load
- [ ] Charts display correct timeframes
- [ ] Symbol change on chart 1 updates chart 2
- [ ] Symbol change on chart 2 updates chart 1
- [ ] Timeframe selector works on upper chart
- [ ] Timeframe selector works on lower chart
- [ ] Layout is responsive (resize browser)
- [ ] WebSocket connections work for both charts
- [ ] Error handling works (disconnect network)
