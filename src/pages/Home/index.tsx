import DualChartLayout from '../../components/DualChartLayout'
import './index.scss'

export default function Home() {
  return (
    <div className="container">
      <DualChartLayout
        defaultSymbol="BTCUSDT"
        upperTimeframe="60"
        lowerTimeframe="15"
        theme="light"
      />
    </div>
  )
}
