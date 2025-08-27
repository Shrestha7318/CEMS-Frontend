<template>
    <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft">
        <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">{{ title }}</h3>
            <ChartControls v-model="selected" @download="handleDownload" />
        </div>

        <v-chart ref="chartRef" :option="option" autoresize class="w-full" style="height: 420px" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import ChartControls from './ChartControls.vue'
import { onBeforeUnmount } from 'vue'
use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent])

const props = defineProps({
    title: { type: String, default: 'Timeseries (Last 2 Days, 5-min)' },
    // array of points: { ts: ISOString, aqi, pm25, pm10, co2, temp, humidity }
    data: { type: Array, default: () => [] },
    // which metrics to show initially
    metrics: { type: Array, default: () => ['pm25', 'pm10', 'aqi'] }
})

const chartRef = ref(null)
const selected = ref([...props.metrics])

// formatters / colors (ECharts uses theme’s palette; we can leave colors automatic)
const metricLabels = {
    aqi: 'AQI',
    pm25: 'PM2.5 (µg/m³)',
    pm10: 'PM10 (µg/m³)',
    co2: 'CO₂ (ppm)',
    temp: 'Temp (°C)',
    humidity: 'Humidity (%)'
}

const x = computed(() => props.data.map(d => d.ts))

const series = computed(() =>
    selected.value.map(key => ({
        name: metricLabels[key] || key,
        type: 'line',
        showSymbol: false,
        smooth: true,
        sampling: 'lttb',
        data: props.data.map(d => d[key] ?? null)
    }))
)

const option = computed(() => ({
    tooltip: {
        trigger: "axis"
    },
    legend: { top: 0 },
    grid: { left: 10, right: 10, top: 30, bottom: 80, containLabel: true },
    dataZoom: [
        { type: 'inside', filterMode: 'none' },   // no UI, just wheel/drag
        { type: 'slider', xAxisIndex: 0, height: 24, bottom: 20 } // the only visible slider
    ],
    xAxis: {
        type: 'time',
        axisLabel: {
            formatter: (value) =>
                new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(new Date(value)),
            hideOverlap: true,
        }
    },
    yAxis: { type: 'value', scale: true },
    series: series.value
}))

watch([() => props.data, selected], () => {
    const chart = chartRef.value?.chart
    if (!chart) return
    // Replace everything so sliders don’t accumulate
    chart.setOption(option.value, { notMerge: true, lazyUpdate: true })
})

onBeforeUnmount(() => {
    chartRef.value?.chart?.dispose?.()
})
function handleDownload(kind) {
    const chart = chartRef.value?.chart
    if (!chart) return

    if (kind === 'png') {
        const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: 'white' })
        const a = document.createElement('a')
        a.href = url
        a.download = `${props.title.replace(/\s+/g, '_')}.png`
        a.click()
    } else if (kind === 'csv') {
        // Build CSV from current selection
        const headers = ['ts', ...selected.value]
        const rows = props.data.map(d => [d.ts, ...selected.value.map(k => d[k] ?? '')])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${props.title.replace(/\s+/g, '_')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }
}
</script>

<style scoped>
/* nothing special */
</style>

<script>
export default {
    components: { 'v-chart': VChart }
}
</script>
