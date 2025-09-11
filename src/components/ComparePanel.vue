<template>
  <section class="space-y-4">
    <CompareChart :seriesByDevice="seriesByDevice" :metric="metricKey" :days="days">
      <template #controls>
        <MetricDropdown v-model="metric" />
        <DeviceMultiDropdown :devices="devices" v-model="selectedDeviceIds" />
        <button
          class="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
          @click="reload" title="Refresh">
          Refresh
        </button>
      </template>
    </CompareChart>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { api } from '@/services/api'
import CompareChart from '@/components/CompareChart.vue'
import DeviceMultiDropdown from '@/components/DeviceMultiDropdown.vue'
import MetricDropdown from '@/components/MetricDropdown.vue'

const days = 3

// UI state
const metric = ref('AQI')     // user-facing value might be "AQI"
const metricKey = computed(() => String(metric.value).toLowerCase())  // -> 'aqi'
const devices = ref([])            // [{ id, name }]
const selectedDeviceIds = ref([])  // ['UTIS0001-TH-V6_1', ...]
const seriesByDevice = ref({})

// metric groups
const TH_METRICS  = new Set(['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination', 'aqi'])
const VOC_METRICS = new Set(['voc', 'o3', 'so2', 'no2'])

// UI metric -> API metric alias
const METRIC_ALIAS = { aqi: 'pm25' }  // we’ll convert pm25 → AQI client-side

onMounted(async () => {
  await refreshDeviceList(true)
  await reload()
})

watch(metricKey, async () => {
  await refreshDeviceList(true)
  await reload()
})
watch(selectedDeviceIds, reload)

// --- helpers ---
function aqiFromPM25(c) {
  const pm = Math.max(0, Number(c))
  const bp = [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ]
  const seg = bp.find(([cl, ch]) => pm >= cl && pm <= ch)
  if (!seg) return 500
  const [Cl, Ch, Il, Ih] = seg
  return Math.round(((Ih - Il) / (Ch - Cl)) * (pm - Cl) + Il)
}

// --- device list + selection ---
async function refreshDeviceList(resetSelection = false) {
  const sites = await api.getSites() // often strings like "UTIS0001-TH-V6_1", "UTIS0001-VOC-V6_1"

  // choose by metric group
  const m = metricKey.value
  let filtered
  if (TH_METRICS.has(m)) {
    filtered = sites.filter(s => String(s).includes('-TH-'))
  } else if (VOC_METRICS.has(m)) {
    filtered = sites.filter(s => String(s).includes('-VOC-'))
  } else {
    filtered = [...sites]
  }

  // fallback: if nothing matched (e.g., sites are base IDs only), use all
  if (!filtered.length) filtered = [...sites]

  // map to dropdown items
  devices.value = filtered.map(id => ({ id, name: id }))

  // select first two if nothing selected or when resetting
  if (resetSelection || !selectedDeviceIds.value.length) {
    selectedDeviceIds.value = devices.value.slice(0, 2).map(d => d.id)
  }

  // helpful logs
  if (import.meta.env.DEV) {
    console.debug('[ComparePanel] metric=', m, 'sites=', sites.length, 'filtered=', filtered.length, 'selected=', selectedDeviceIds.value.length)
  }

  // ensure the dropdown sees the update before we reload
  await nextTick()
}

// --- fetch time series ---
async function reload() {
  if (!selectedDeviceIds.value.length) {
    seriesByDevice.value = {}
    return
  }

  const hours = days * 24
  const m = metricKey.value.toLowerCase()
  const apiMetric = (m === 'aqi') ? 'pm25' : m

  // 1) fetch numeric series
  const raw = await api.getTimeseriesByMetric({
    metric: apiMetric,
    siteIds: selectedDeviceIds.value,
    hours
  }) // -> { [siteId]: [{ ts(ms), value(number) }, ...] }

  // 2) If AQI, convert pm25->aqi on the fly
  if (m === 'aqi') {
    const mapped = {}
    for (const [site, rows] of Object.entries(raw || {})) {
      mapped[site] = (rows || [])
        .map(p => ({ ts: p.ts, value: aqiFromPM25(p.value) }))
        .filter(p => Number.isFinite(p.value))
    }
    seriesByDevice.value = mapped
  } else {
    seriesByDevice.value = raw || {}
  }

  // dev logs to verify
  if (import.meta.env.DEV) {
    const keys = Object.keys(seriesByDevice.value)
    const firstKey = keys[0]
    console.debug('[Panel] metric=', m, 'devices=', keys.length, 'first len=', firstKey ? seriesByDevice.value[firstKey]?.length : 0)
  }
}

</script>
