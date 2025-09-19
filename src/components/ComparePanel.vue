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
      ref="chartComp"
      :key="chartKey"
      :seriesByDevice="seriesByDevice"
      :metric="metricKey"
      :days="daysForChart"
      :hours="rangeHours"
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

const props = defineProps({
  uid: { type: [Number, String], required: true },
  displayId: { type: Number, required: true },
  devicesProp: { type: Array, default: () => [] },
  canRemove: { type: Boolean, default: true },
})
defineEmits(['remove'])

/* ----------------------- State ----------------------- */
const chartComp = ref(null)

const range = ref('24h')
const rangeHours = computed(() => {
  if (range.value.endsWith('h')) return parseInt(range.value)
  if (range.value.endsWith('d')) return parseInt(range.value) * 24
  return 24
})
const daysForChart = computed(() => Math.max(1, Math.round(rangeHours.value / 24)))

const metric = ref('pm25')
const metricKey = computed(() => String(metric.value).toLowerCase())

const internalDevices = ref([])
const TH_METRICS = new Set(['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination', 'aqi'])
const VOC_METRICS = new Set(['voc', 'o3', 'so2', 'no2'])

const selectedDeviceIds = ref([])
const seriesByDevice = ref({})
const loading = ref(true)

/* ----------------------- Device options ----------------------- */
const ID_TO_LOCATION = Object.fromEntries(
  MAP_DEVICES.flatMap(d => [
    [d.sites.th, d.name],
    [d.sites.voc, d.name],
  ])
)

function labelForSite(siteId) {
  const base = ID_TO_LOCATION[siteId] || siteId
  const type = siteId.includes('-TH-') ? ' (TH)' : siteId.includes('-VOC-') ? ' (VOC)' : ''
  return base + type
}

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

/* ----------------------- Helpers ----------------------- */
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

/** Rough check if current data span ~= 24h */
function currentSpanLooksLike24h() {
  let min = Infinity, max = -Infinity
  for (const rows of Object.values(seriesByDevice.value || {})) {
    if (!rows?.length) continue
    const first = Date.parse(rows[0].ts)
    const last = Date.parse(rows[rows.length - 1].ts)
    if (Number.isFinite(first) && first < min) min = first
    if (Number.isFinite(last) && last > max) max = last
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false
  const spanHrs = (max - min) / 36e5
  return spanHrs >= 20 && spanHrs <= 28
}

/* Utility to set range without triggering the watcher reload */
let skipReloadOnce = false
function setRangeSilently(v) {
  skipReloadOnce = true
  range.value = v
}

/* ----------------------- Lifecycle ----------------------- */
onMounted(async () => {
  await refreshDeviceList(true)
  api.warm7dForMetric(metricKey.value, (props.devicesProp || []).map(d => (typeof d === 'string' ? d : d.id)))
  await reload()
})

watch(metricKey, async () => {
  await refreshDeviceList(true)
  api.warm7dForMetric(metricKey.value, (props.devicesProp || []).map(d => (typeof d === 'string' ? d : d.id)))
  await reload()
})
watch(selectedDeviceIds, reload)

/* Intercept range changes to keep dropdown accurate and adjust zoom */
watch(range, async (newVal, oldVal) => {
  if (skipReloadOnce) {
    skipReloadOnce = false
    return
  }

  // 6h / 12h: slide the window; if coming from non-24h, hop via 24h first
  if (newVal === '6h' || newVal === '12h') {
    const targetHours = newVal === '6h' ? 6 : 12.1

    if (oldVal === '24h' && currentSpanLooksLike24h()) {
      await nextTick()
      chartComp.value?.slideToHours?.(targetHours)
      return
    }

    // From any other range: load 24h, then slide, then put dropdown back to 6h/12h
    const keep = newVal
    setRangeSilently('24h')
    await nextTick()
    await reload()
    await nextTick()
    chartComp.value?.slideToHours?.(targetHours)
    setRangeSilently(keep) // reflect selection in dropdown without extra reload
    return
  }

  // 24h: reload and then expand zoom to full extent
  if (newVal === '24h') {
    await reload()
    await nextTick()
    chartComp.value?.zoomFull?.()
    return
  }

  // 3d / 7d: normal reload 
  await reload()
})

/* ----------------------- Data fetching ----------------------- */
async function refreshDeviceList(resetSelection = false) {
  let sites = (props.devicesProp?.length ? props.devicesProp.map(d => (typeof d === 'string' ? d : d.id)) : null)
  if (!sites || !sites.length) {
    sites = await api.getSites() // cached
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

/** Fetch & prepare time series with "24h first, then upgrade" behavior */
async function reload() {
  const ids = coerceSelectionToMetric(selectedDeviceIds.value)
  if (!ids.length) {
    seriesByDevice.value = {}
    return
  }

  loading.value = true
  try {
    const m = metricKey.value.toLowerCase()
    const apiMetric = (m === 'aqi') ? 'pm25' : m
    const wantHours = rangeHours.value

    if (wantHours > 24) {
      const shortRaw = await api.getTimeseriesByMetric({ metric: apiMetric, siteIds: ids, hours: 24 })
      const shortLabeled = labelSeries(shortRaw, m)
      seriesByDevice.value = shortLabeled

      api.warm7dForMetric(apiMetric)
      const longRaw = await api.getTimeseriesByMetric({ metric: apiMetric, siteIds: ids, hours: wantHours })
      const longLabeled = labelSeries(longRaw, m)
      seriesByDevice.value = longLabeled
    } else {
      const raw = await api.getTimeseriesByMetric({ metric: apiMetric, siteIds: ids, hours: wantHours })
      const labeled = labelSeries(raw, m)
      seriesByDevice.value = labeled

      // If user is on 6h/12h, enforce exact window (in case zoom retained)
      await nextTick()
      if (range.value === '6h') chartComp.value?.slideToHours?.(6)
      if (range.value === '12h') chartComp.value?.slideToHours?.(12)
      if (range.value === '24h') chartComp.value?.zoomFull?.()
    }
  } finally {
    loading.value = false
  }
}

function labelSeries(obj, m) {
  let byId = obj || {}
  if (m === 'aqi') {
    const out = {}
    for (const [site, rows] of Object.entries(byId)) {
      out[site] = (rows || []).map(p => ({ ts: p.ts, value: aqiFromPM25(p.value) }))
    }
    byId = out
  }
  const labeled = {}
  for (const [siteId, rows] of Object.entries(byId)) {
    labeled[labelForSite(siteId)] = rows
  }
  return labeled
}

/* Exclude range from key to avoid remount on 6h/12h slides */
const chartKey = computed(() => {
  const ids = selectedDeviceIds.value.slice().sort().join('|')
  return `${metricKey.value}_${ids}`
})
</script>
