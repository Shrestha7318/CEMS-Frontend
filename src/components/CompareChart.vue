<template>
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold"></h3>
    <div class="flex items-center gap-2">
      <slot name="controls" />
    </div>
  </div>

  <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold">Comparison — {{ labelFor(metric) }}</h3>
      <div class="text-xs text-gray-500">Last {{ days }} day(s)</div>
    </div>
    <v-chart :option="option" autoresize style="height: 420px" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'
use([CanvasRenderer, LineChart, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent])

const props = defineProps({
  // Accepts either:
  //   { SITE_A: [{ ts, value }...], SITE_B: [...] }  <-- live API shape
  // or:
  //   { SITE_A: [{ ts, pm25|voc|... }...], ... }     <-- legacy mock shape
  seriesByDevice: { type: Object, default: () => ({}) },
  metric: { type: String, default: 'pm25' },
  days: { type: Number, default: 3 },
})

const LABELS = {
  aqi: 'AQI',
  pm25: 'PM2.5 (µg/m³)',
  pm10: 'PM10 (µg/m³)',
  temperature: 'Temp (°C)',
  humidity: 'Humidity (%)',
  noise: 'Noise (dB)',
  illumination: 'Illumination (lx)',
  voc: 'VOC',
  o3: 'O₃',
  so2: 'SO₂',
  no2: 'NO₂',
}
const UNITS = {
  aqi: '', pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°C', humidity: '%',
  noise: 'dB', illumination: 'lx', voc: '', o3: '', so2: '', no2: ''
}
const labelFor = k => LABELS[k] || k

function toMs(t) {
  if (typeof t === 'number') return t < 1e12 ? t * 1000 : t
  const ms = Date.parse(t)
  return Number.isFinite(ms) ? ms : NaN
}

const series = computed(() =>
  Object.entries(props.seriesByDevice).map(([deviceId, rows]) => ({
    name: deviceId,
    type: 'line',
    showSymbol: false,
    smooth: false,
    sampling: 'lttb',
    data: (rows || [])
     .map(d => {
       const x = toMs(d.ts)
       // support both {ts,value} and {ts, pm25/temp/...}
       const y = d.value ?? d?.[props.metric] ?? null
       return [x, y]
     })
     .filter(([x, y]) => Number.isFinite(x) && y != null && !Number.isNaN(y))
  }))
)

const option = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { top: 0 },
  grid: { left: 10, right: 10, top: 30, bottom: 60, containLabel: true },
  dataZoom: [
    { type: 'inside', xAxisIndex: 0 },
    { type: 'slider', xAxisIndex: 0, height: 20, bottom: 20 }
  ],
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: v => new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(v)),
      hideOverlap: true
    },
    splitNumber: 6
  },
  yAxis: { type: 'value', scale: true, name: UNITS[props.metric] || '', nameGap: 10 },
  series: series.value
}))
</script>
