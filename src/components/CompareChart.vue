<template>
  <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft relative">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h3 class="font-semibold">Comparison — {{ labelFor(metric) }}</h3>
      <div class="flex items-center gap-2 flex-wrap">
        <slot name="controls" />
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="busy" class="h-[420px] animate-pulse space-y-4">
      <div class="h-6 w-40 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
      <div class="h-40 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
      <div class="grid grid-cols-3 gap-3">
        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
      </div>
      <div class="absolute inset-0 grid place-items-center pointer-events-none">
        <svg class="h-7 w-7 animate-spin opacity-70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!hasAnyData"
      class="h-[420px] grid place-items-center text-sm text-gray-500 dark:text-gray-400">
      No data to display for {{ labelFor(metric) }} in the selected range.
    </div>

    <!-- Chart -->
    <VChart
      v-else
      :key="chartKey"
      ref="chartRef"
      :option="option"
      autoresize
      style="height: 420px"
    />
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent])

const props = defineProps({
  seriesByDevice: { type: Object, default: () => ({}) }, // { deviceLabel: [{ts, value}], ... }
  metric: { type: String, default: 'pm25' },
  days: { type: Number, default: 3 },
  hours: { type: Number, default: 24 }, 
  busy: { type: Boolean, default: false },
})

const chartRef = ref(null)

const LABELS = {
  pm25: 'PM2.5 (µg/m³)',
  pm10: 'PM10 (µg/m³)',
  temperature: 'Temp (°F)',
  humidity: 'Humidity (%)',
  noise: 'Noise (dB)',
  voc: 'VOC (ppm)',
  o3: 'O₃ (ppm)',
  so2: 'SO₂ (ppm)',
  no2: 'NO₂ (ppm)',
}
const UNITS = {
  pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°F', humidity: '%',
  noise: 'dB', voc: 'ppm', o3: 'ppm', so2: 'ppm', no2: 'ppm'
}
const labelFor = k => LABELS[k] || k

function toMs(ts) {
  if (typeof ts === 'number') return ts < 1e12 ? ts * 1000 : ts
  const ms = Date.parse(ts)
  return Number.isFinite(ms) ? ms : NaN
}

const builtSeries = computed(() => {
  return Object.entries(props.seriesByDevice || {}).map(([deviceLabel, rows]) => {
    const data = (rows || [])
      .map(d => {
        const x = toMs(d.ts)
        const y = d.value ?? d?.[props.metric] ?? null
        const yNum = typeof y === 'string' ? parseFloat(y) : y
        return (Number.isFinite(x) && Number.isFinite(yNum)) ? [x, yNum] : null
      })
      .filter(Boolean)
      .sort((a, b) => a[0] - b[0])
    return { name: deviceLabel, type: 'line', showSymbol: false, smooth: false, sampling: 'lttb', data }
  })
})

const hasAnyData = computed(() => builtSeries.value.some(s => (s.data?.length || 0) > 0))

// We exclude "hours" from the key on purpose to avoid remounting when user only moves the window.
const chartKey = computed(() => {
  const ids = Object.keys(props.seriesByDevice || {}).sort().join('|')
  return `${props.metric}_${ids}_${hasAnyData.value ? '1' : '0'}`
})

// Compute the current x-extent of the (combined) series
const xExtent = computed(() => {
  let min = Infinity, max = -Infinity
  for (const s of builtSeries.value) {
    if (!s.data?.length) continue
    const first = s.data[0][0]
    const last = s.data[s.data.length - 1][0]
    if (first < min) min = first
    if (last > max) max = last
  }
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null
})

const option = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { top: 0 },
  grid: { left: 10, right: 10, top: 30, bottom: 60, containLabel: true },
  dataZoom: [
    { id: 'dz-inside', type: 'inside', xAxisIndex: 0 },
    { id: 'dz-slider', type: 'slider', xAxisIndex: 0, height: 20, bottom: 20 }
  ],
  xAxis: {
    type: 'time',
    splitNumber: 6,
    axisLabel: {
      hideOverlap: true,
      formatter: v => new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(v)),
    },
  },
  yAxis: { type: 'value', scale: true, name: UNITS[props.metric] || '', nameGap: 10 },
  series: builtSeries.value,
}))

/** Public API: slide the dataZoom to show the last `hours` of data (without remounting). */
async function slideToHours(hours) {
  const inst = chartRef.value?.chart
  if (!inst || !xExtent.value) return
  const end = xExtent.value.max
  const start = end - hours * 3600 * 1000

  // Make sure option is applied before we dispatch
  await nextTick()

  // Dispatch against both zooms (inside + slider) to keep them in sync
  inst.dispatchAction({ type: 'dataZoom', dataZoomId: 'dz-inside', startValue: start, endValue: end })
  inst.dispatchAction({ type: 'dataZoom', dataZoomId: 'dz-slider', startValue: start, endValue: end })
}
// in option.dataZoom, ensure ids exist:
dataZoom: [
  { id: 'dz-inside', type: 'inside', xAxisIndex: 0 },
  { id: 'dz-slider', type: 'slider', xAxisIndex: 0, height: 20, bottom: 20 }
]

async function zoomFull() {
  const inst = chartRef.value?.chart
  if (!inst) return
  await nextTick()
  // Reset to full extent
  inst.dispatchAction({ type: 'dataZoom', dataZoomId: 'dz-inside', start: 0, end: 100 })
  inst.dispatchAction({ type: 'dataZoom', dataZoomId: 'dz-slider', start: 0, end: 100 })
}

defineExpose({ slideToHours, zoomFull })


</script>
