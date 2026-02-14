# 现代技术栈迁移设计

**创建日期**: 2026-02-11
**目标**: 将项目从 React 17 + CRA + JS 迁移到 React 18 + Vite + TypeScript + Hooks

## 概述

### 迁移目标
- 构建工具: react-scripts 4.0.1 → Vite 5.x
- React: 17.0.1 → 18.3.x
- 语言: JavaScript → TypeScript 5.x
- 组件风格: Class 组件 → Hooks

### 迁移策略
渐进式迁移，每个阶段完成后项目都可正常运行验证。

---

## 阶段 1：构建系统升级

### 1.1 依赖变更

**移除:**
- `react-scripts: 4.0.1`
- `node-sass: ^4.12.0` (已弃用)

**添加:**
- `vite: ^5.4.0`
- `@vitejs/plugin-react: ^4.3.0`
- `sass: ^1.77.0`

**升级:**
- `react: ^17.0.1` → `react: ^18.3.0`
- `react-dom: ^17.0.1` → `react-dom: ^18.3.0`

### 1.2 文件结构变更

```
移动:
  public/index.html → index.html (根目录)

新增:
  vite.config.js
  src/vite-env.d.ts

修改:
  src/index.js → 使用 ReactDOM.createRoot
  index.html → 添加 <script type="module" src="/src/index.js">

移除:
  server.js (开发阶段不再需要)
```

### 1.3 Vite 配置

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
})
```

### 1.4 验证清单
- [ ] `npm run dev` 启动成功
- [ ] 图表正常加载
- [ ] Binance 数据正常获取
- [ ] WebSocket 连接正常

---

## 阶段 2：TypeScript 迁移

### 2.1 依赖添加

```bash
npm install -D typescript @types/react @types/react-dom @types/node @types/ws
```

### 2.2 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### 2.3 文件重命名

| 原文件 | 新文件 |
|--------|--------|
| `src/index.js` | `src/main.tsx` |
| `src/pages/Home/index.js` | `src/pages/Home/index.tsx` |
| `src/pages/Home/index.scss` | `src/pages/Home/index.module.scss` |
| `src/components/TradingViewChart/index.js` | `src/components/TradingViewChart/index.tsx` |
| `src/components/TradingViewChart/index.scss` | `src/components/TradingViewChart/index.module.scss` |
| `src/services/api.js` | `src/services/api.ts` |
| `src/services/socketClient.js` | `src/services/socketClient.ts` |
| `src/assets/scss/global.scss` | (保持不变) |

### 2.4 关键类型定义

```ts
// src/types/tradingview.d.ts

// TradingView 全局对象
declare global {
  interface Window {
    TradingView: {
      widget: new (options: WidgetOptions) => TradingViewWidget
    }
  }
}

// Datafeed 接口 (TradingView 要求)
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
    listenerGuid: string
  ): void
  unsubscribeBars(listenerGuid: string): void
}

// K线数据
export interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 图表配置
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
```

### 2.5 验证清单
- [ ] `tsc --noEmit` 无类型错误
- [ ] 所有组件正常渲染
- [ ] API 调用类型正确
- [ ] WebSocket 消息类型正确

---

## 阶段 3：Hooks 重构

### 3.1 Home 组件

```tsx
// src/pages/Home/index.tsx
import { useMemo } from 'react'
import TradingViewChart from '../../components/TradingViewChart'
import type { ChartProperties } from '../../types/tradingview'
import './index.scss'

function getLocalLanguage() {
  return navigator.language.split('-')[0] || 'en'
}

export default function Home() {
  const cOptions = useMemo<ChartProperties>(() => ({
    locale: getLocalLanguage(),
    debug: false,
    symbol: 'BTCUSDT',
    interval: '60',
    theme: 'light',
    allow_symbol_change: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autosize: true,
  }), [])

  return (
    <div className="container">
      <div className="trading-chart">
        <TradingViewChart chartProperties={cOptions} />
      </div>
    </div>
  )
}
```

### 3.2 TradingViewChart 组件

```tsx
// src/components/TradingViewChart/index.tsx
import { useEffect, useRef } from 'react'
import BinanceAPI from '../../services/api'
import type { ChartProperties } from '../../types/tradingview'
import './index.scss'

interface TradingViewChartProps {
  chartProperties: ChartProperties
}

export default function TradingViewChart({ chartProperties }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<TradingViewWidget | null>(null)
  const apiRef = useRef<BinanceAPI | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    apiRef.current = new BinanceAPI({ debug: false })

    widgetRef.current = new window.TradingView.widget({
      container_id: 'chart_container',
      datafeed: apiRef.current,
      library_path: '/scripts/charting_library/',
      disabled_features: ['timeframes_toolbar', 'header_undo_redo'],
      ...chartProperties
    })

    return () => {
      // 清理资源
    }
  }, [chartProperties])

  return <div id="chart_container" ref={containerRef} />
}
```

### 3.3 BinanceAPI 保留类结构

**决策**: 保持类结构，不转换为函数式模块。

**原因**:
1. TradingView Datafeed 接口本身就是面向对象设计
2. 需要维护内部状态（symbols 缓存、ws 连接）
3. 改成函数式不会带来明显收益，反而增加复杂度

```ts
// src/services/api.ts
import BinanceWS from './socketClient'
import type { Datafeed, Bar, SymbolInfo } from '../types/tradingview'

export default class BinanceAPI implements Datafeed {
  private binanceHost = 'https://api.binance.com'
  private debug: boolean
  private ws: BinanceWS
  private symbols: Symbol[] = []

  constructor(options: { debug: boolean }) {
    this.debug = options.debug || false
    this.ws = new BinanceWS()
  }

  // 实现 Datafeed 接口...
}
```

### 3.4 验证清单
- [ ] 组件正常渲染
- [ ] useEffect 清理函数正确执行
- [ ] 图表切换 symbol 正常
- [ ] WebSocket 断开重连正常
- [ ] 无内存泄漏

---

## 最终目录结构

```
react-tradingview/
├── index.html
├── vite.config.js
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx                    # 入口
│   ├── vite-env.d.ts               # Vite 类型
│   ├── types/
│   │   └── tradingview.d.ts        # TradingView 类型定义
│   ├── pages/
│   │   └── Home/
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── components/
│   │   └── TradingViewChart/
│   │       ├── index.tsx
│   │       └── index.scss
│   ├── services/
│   │   ├── api.ts                  # Binance API (类)
│   │   └── socketClient.ts         # WebSocket 客户端 (类)
│   └── assets/
│       └── scss/
│           ├── global.scss
│           └── variables.scss
└── public/
    └── scripts/
        └── charting_library/       # TradingView 库 (不提交)
```

---

## 命令变更

```json
// package.json scripts
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
}
```

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| TradingView 全局类型定义复杂 | 参考 charting_library.d.ts 官方定义 |
| WebSocket 状态管理迁移出错 | 保持类结构，仅添加类型 |
| SCSS 模块化导致样式失效 | 先保持全局 SCSS，后续可选模块化 |

---

## 预计时间

| 阶段 | 预计时间 |
|------|----------|
| 阶段 1: 构建系统升级 | 30 分钟 |
| 阶段 2: TypeScript 迁移 | 1 小时 |
| 阶段 3: Hooks 重构 | 45 分钟 |
| **总计** | **约 2-3 小时** |
