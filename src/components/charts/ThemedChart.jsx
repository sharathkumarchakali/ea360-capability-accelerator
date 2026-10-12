import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * Shared ECharts wrapper. Every chart in the app renders through this so legends,
 * grids, labels and tooltips behave the same and never overlap the plot area.
 * Colours are the existing brand tokens; per-chart series colours are untouched.
 */
const FONT = 'Inter, system-ui, -apple-system, sans-serif'
const MUTED = '#55717a'
const INK = '#073642'
const BORDER = '#d5e4e8'

const toArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])

function themeAxis(axis, dir) {
  if (!axis) return axis
  return toArray(axis).map((a) => {
    const next = {
      ...a,
      nameTextStyle: { color: MUTED, fontSize: 12, fontFamily: FONT, ...a.nameTextStyle },
      axisLabel: { color: MUTED, fontSize: 12, fontFamily: FONT, hideOverlap: true, ...a.axisLabel },
      axisLine: { lineStyle: { color: BORDER }, ...a.axisLine },
      axisTick: { show: false, ...a.axisTick },
    }
    if (a.name) next.nameGap = dir === 'x' ? 32 : 40
    if (a.type === 'category') {
      next.axisLabel = {
        interval: 0,
        hideOverlap: true,
        ...(dir === 'x'
          ? { width: 84, overflow: 'break', lineHeight: 14 }
          : { width: 120, overflow: 'truncate' }),
        ...next.axisLabel,
      }
    }
    if (a.splitLine) {
      next.splitLine = { ...a.splitLine, lineStyle: { color: BORDER, type: 'dashed', opacity: 0.6 } }
    }
    return next
  })
}

export function themeOption(option) {
  const series = toArray(option.series)
  const hasPie = series.some((s) => s.type === 'pie')
  const hasLegend = Boolean(option.legend) || (hasPie && series.some((s) => s.type === 'pie'))

  const out = {
    ...option,
    textStyle: { fontFamily: FONT, color: MUTED, ...option.textStyle },
    tooltip: {
      confine: true,
      backgroundColor: '#ffffff',
      borderColor: BORDER,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: INK, fontSize: 12, fontFamily: FONT },
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(7,54,66,0.08);',
      ...option.tooltip,
    },
  }

  if (hasLegend) {
    out.legend = {
      type: 'plain',
      orient: 'horizontal',
      left: 'center',
      right: undefined,
      top: undefined,
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14,
      pageIconSize: 10,
      ...option.legend,
      // position is always normalised so the legend never sits on top of the plot
      orient: 'horizontal',
      left: 'center',
      top: 'auto',
      right: 'auto',
      bottom: 0,
      textStyle: { color: MUTED, fontSize: 12, fontFamily: FONT },
    }
  }

  if (hasPie) {
    out.series = series.map((s) =>
      s.type === 'pie'
        ? {
            ...s,
            center: ['50%', '40%'],
            radius: ['46%', '66%'],
            label: { show: false },
            labelLine: { show: false },
            emphasis: { scale: true, scaleSize: 4, ...s.emphasis },
          }
        : s,
    )
    return out
  }

  // Cartesian charts
  const xName = toArray(option.xAxis).some((a) => a.name)
  const yName = toArray(option.yAxis).some((a) => a.name)
  out.grid = {
    containLabel: true,
    left: 12 + (yName ? 28 : 0),
    right: 36,
    top: 24,
    bottom: 12 + (xName ? 28 : 0) + (hasLegend ? 44 : 0),
  }
  if (option.xAxis) out.xAxis = themeAxis(option.xAxis, 'x')
  if (option.yAxis) out.yAxis = themeAxis(option.yAxis, 'y')
  out.series = series.map((s) =>
    s.type === 'scatter'
      ? {
          ...s,
          symbolSize: s.symbolSize ?? 14,
          // always-on labels collide; show the name on hover instead
          label: { ...s.label, show: false },
          emphasis: {
            focus: 'self',
            scale: 1.3,
            label: {
              show: true,
              position: 'top',
              color: INK,
              fontSize: 11,
              fontFamily: FONT,
              backgroundColor: '#ffffff',
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 6,
              padding: [3, 6],
              formatter: s.label?.formatter,
            },
          },
        }
      : s.type === 'bar'
        ? { ...s, barMaxWidth: s.barMaxWidth ?? 36, itemStyle: { borderRadius: s.stack ? 0 : [4, 4, 0, 0], ...s.itemStyle } }
        : s,
  )
  return out
}

export default function ThemedChart({ option, notMerge = true, ...rest }) {
  const themed = useMemo(() => themeOption(option), [option])
  return <ReactECharts option={themed} notMerge={notMerge} {...rest} />
}
