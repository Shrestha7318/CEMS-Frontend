<template>
  <section class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1></h1>
      <button
        v-if="canRemove"
        class="text-rose-600 hover:text-rose-700 text-sm"
        @click="$emit('remove', uid)"
        aria-label="Remove this comparison panel">
        Remove
      </button>
    </div>

    <CompareChart
      :key="chartKey"
      :seriesByDevice="seriesByDevice"
      :metric="metricKey"
      :days="daysForChart"
      :busy="loading"            
    >
      <template #controls>
        <MetricDropdown v-model="metric" />
        <DeviceMultiDropdown :devices="deviceOptions" v-model="selectedDeviceIds" />

        <!-- Range selector -->
        <div class="relative">
          <select
            v-model="range"
            class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
            title="Select range">
            <option value="6h">6h</option>
            <option value="12h">12h</option>
            <option value="24h">24h</option>
            <option value="3d">3d</option>
            <option value="7d">7d</option>
          </select>
        </div>

        <button
          class="hidden md:inline-flex px-3 text-white py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm
                 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="reload"
          :disabled="loading"     
          :aria-busy="loading"
          title="Refresh">
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
import { MAP_DEVICES } from '@/constants/mapSites.js'

/** ------------ Props & Emits ------------ */
const props = defineProps({
  uid: { type: [Number, String], required: true },
  displayId: { type: Number, required: true },
  devicesProp: { type: Array, default: () => [] },
  canRemove: { type: Boolean, default: true },
})
defineEmits(['remove'])

/** ------------ Range state ------------ */
const range = ref('24h')
const rangeHours = computed(() => {
  if (range.value.endsWith('h')) return parseInt(range.value)
  if (range.value.endsWith('d')) return parseInt(range.value) * 24
  return 24
})
const daysForChart = computed(() => Math.max(1, Math.round(rangeHours.value / 24)))

/** ------------ Metric / devices ------------ */
const metric = ref('pm25')
const metricKey = computed(() => String(metric.value).toLowerCase())

const internalDevices = ref([])
const TH_METRICS = new Set(['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination', 'aqi'])
const VOC_METRICS = new Set(['voc', 'o3', 'so2', 'no2'])

const deviceOptions = computed(() => {
  const src = (props.devicesProp?.length ? props.devicesProp : internalDevices.value) ?? []
  const normalized = src.map(d => {
    const id = typeof d === 'string' ? d : d.id
    return { id, name: labelForSite(id) }
  })

  const m = metricKey.value
  const want = TH_METRICS.has(m) ? '-TH-' : VOC_METRICS.has(m) ? '-VOC-' : null
  if (!want) return normalized
  const subset = normalized.filter(d => String(d.id).includes(want))
  return subset.length ? subset : normalized
})

const selectedDeviceIds = ref([])
const seriesByDevice = ref({})

const ID_TO_LOCATION = Object.fromEntries(
  MAP_DEVICES.flatMap(d => [
    [d.sites.th, d.name],
    [d.sites.voc, d.name],
  ])
)

/** ------------ Loading flag (NEW) ------------ */
const loading = ref(true)   // NEW: start in loading state

/** ------------ Lifecycle ------------ */
onMounted(async () => {
  await refreshDeviceList(true)
  await reload()
})

watch(metricKey, async () => {
  await refreshDeviceList(true)
  await reload()
})
watch(selectedDeviceIds, reload)
watch(range, reload)

function labelForSite(siteId) {
  const base = ID_TO_LOCATION[siteId] || siteId
  const type = siteId.includes('-TH-') ? ' (TH)' : siteId.includes('-VOC-') ? ' (VOC)' : ''
  return base + type
}

/** ------------ Helpers ------------ */
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

function coerceSelectionToMetric(ids) {
  const m = metricKey.value
  const tag = TH_METRICS.has(m) ? '-TH-' : VOC_METRICS.has(m) ? '-VOC-' : null
  if (!tag) return ids
  const anyTagged = ids.some(id => String(id).includes(tag))
  return anyTagged ? ids.filter(id => String(id).includes(tag)) : ids
}

async function refreshDeviceList(resetSelection = false) {
  let sites = (props.devicesProp?.length ? props.devicesProp.map(d => (typeof d === 'string' ? d : d.id)) : null)
  if (!sites || !sites.length) {
    sites = await api.getSites()
  }

  const m = metricKey.value
  let filtered
  if (TH_METRICS.has(m)) filtered = sites.filter(s => String(s).includes('-TH-'))
  else if (VOC_METRICS.has(m)) filtered = sites.filter(s => String(s).includes('-VOC-'))
  else filtered = [...sites]
  if (!filtered.length) filtered = [...sites]

  if (!props.devicesProp?.length) {
    internalDevices.value = filtered.map(id => ({ id, name: labelForSite(id) }))
  }
  if (resetSelection || !selectedDeviceIds.value.length) {
    const source = deviceOptions.value.length ? deviceOptions.value : internalDevices.value
    selectedDeviceIds.value = source.slice(0, 2).map(d => d.id)
  } else {
    const coerced = coerceSelectionToMetric(selectedDeviceIds.value)
    if (!coerced.length && deviceOptions.value.length) {
      selectedDeviceIds.value = deviceOptions.value.slice(0, 2).map(d => d.id)
    } else {
      selectedDeviceIds.value = coerced
    }
  }

  await nextTick()
}

/** ------------ Fetch and prepare time series ------------ */
async function reload() {
  const ids = coerceSelectionToMetric(selectedDeviceIds.value)
  if (!ids.length) {
    seriesByDevice.value = {}
    return
  }

  loading.value = true               // NEW
  try {
    const hours = rangeHours.value
    const m = metricKey.value.toLowerCase()
    const apiMetric = (m === 'aqi') ? 'pm25' : m

    const raw = await api.getTimeseriesByMetric({
      metric: apiMetric,
      siteIds: ids,
      hours
    })

    let byId
    if (m === 'aqi') {
      byId = {}
      for (const [site, rows] of Object.entries(raw || {})) {
        byId[site] = (rows || [])
          .map(p => ({ ts: p.ts, value: aqiFromPM25(p.value) }))
          .filter(p => Number.isFinite(p.value))
      }
    } else {
      byId = raw || {}
    }

    const labeled = {}
    for (const [siteId, rows] of Object.entries(byId)) {
      labeled[labelForSite(siteId)] = rows
    }
    seriesByDevice.value = labeled
  } finally {
    loading.value = false            // NEW
  }
}

/** Force chart rerender if metric/devices/range changes */
const chartKey = computed(() => {
  const ids = selectedDeviceIds.value.slice().sort().join('|')
  return `${metricKey.value}_${range.value}_${ids}`
})
</script>
