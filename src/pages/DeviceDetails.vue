<template>
  <!-- Initial full-screen loading -->
  <section v-if="loading" class="min-h-[70vh] grid place-items-center">
    <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
      </svg>
      <span>Loading device…</span>
    </div>
  </section>

  <!-- Content -->
  <section v-else-if="device" class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">{{ device.name }}</h1>
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span class="font-mono">{{ device.id }}</span>
          <span>•</span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs"
                :class="device.status === 'online'
                         ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                         : 'border-rose-300 text-rose-600 dark:text-rose-400'">
            <span class="h-2 w-2 rounded-full"
                  :class="device.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'"></span>
            {{ device.status }}
          </span>
          <span>•</span>
          <span>Last seen: {{ device.lastSeen ? new Date(device.lastSeen).toLocaleString() : '—' }}</span>
        </div>
      </div>

      <RouterLink to="/devices"
        class="self-start md:self-auto text-emerald-600 hover:underline">← Back to devices</RouterLink>
    </div>

    <!-- “Now” panel (clean info view instead of many stat cards) -->
    <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
      <h3 class="font-semibold mb-4">Now</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">PM2.5</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.pm25) }} <span class="text-xs font-normal">µg/m³</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">PM10</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.pm10) }} <span class="text-xs font-normal">µg/m³</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">Temp</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.temperature) }} <span class="text-xs font-normal">°C</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">Humidity</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.humidity) }} <span class="text-xs font-normal">%</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">Noise</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.noise) }} <span class="text-xs font-normal">dB</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">Illumination</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.th?.illumination) }} <span class="text-xs font-normal">lx</span></div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">VOC</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.voc?.voc) }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">O₃</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.voc?.o3) }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">SO₂</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.voc?.so2) }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
          <div class="text-gray-500 dark:text-gray-400">NO₂</div>
          <div class="mt-1 text-lg font-semibold">{{ fmt(latest.voc?.no2) }}</div>
        </div>
      </div>

      <div class="mt-4 grid sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
        <div><b>Latitude:</b> {{ device.lat }}</div>
        <div><b>Longitude:</b> {{ device.lon }}</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- TH chart -->
      <CompareChart
        v-if="thChartEnabled"
        :seriesByDevice="thSeriesByDevice"
        :metric="thMetric"
        :days="thDays"
      >
        <template #controls>
          <div class="flex items-center gap-2">
            <!-- Metric selector -->
            <select v-model="thMetric" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
              <option value="pm25">PM2.5</option>
              <option value="pm10">PM10</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="noise">Noise</option>
              <option value="illumination">Illumination</option>
            </select>
            <!-- Range selector -->
            <select v-model="thRange" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
              <option value="6h">6h</option>
              <option value="12h">12h</option>
              <option value="24h">24h</option>
              <option value="3d">3d</option>
              <option value="7d">7d</option>
            </select>
            <button class="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    @click="reloadTH">Refresh</button>
          </div>
        </template>
      </CompareChart>

      <!-- VOC chart -->
      <CompareChart
        v-if="vocChartEnabled"
        :seriesByDevice="vocSeriesByDevice"
        :metric="vocMetric"
        :days="vocDays"
      >
        <template #controls>
          <div class="flex items-center gap-2">
            <!-- Metric selector -->
            <select v-model="vocMetric" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
              <option value="voc">VOC</option>
              <option value="o3">O₃</option>
              <option value="so2">SO₂</option>
              <option value="no2">NO₂</option>
            </select>
            <!-- Range selector -->
            <select v-model="vocRange" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
              <option value="6h">6h</option>
              <option value="12h">12h</option>
              <option value="24h">24h</option>
              <option value="3d">3d</option>
              <option value="7d">7d</option>
            </select>
            <button class="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    @click="reloadVOC">Refresh</button>
          </div>
        </template>
      </CompareChart>
    </div>
  </section>

  <section v-else class="text-sm text-gray-500">Not found.</section>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import CompareChart from '@/components/CompareChart.vue'
import { MAP_DEVICES, thSiteOf, vocSiteOf } from '@/constants/mapSites'

const route = useRoute()

const loading = ref(true)

const device = ref(null)           // { id, name, lat, lon, status, lastSeen }
const latest = ref({ th: null, voc: null })

const thSeriesByDevice = ref(null) // { [thSiteId]: [{ts,value}...] }
const vocSeriesByDevice = ref(null) // { [vocSiteId]: [{ts,value}...] }

const STALE_MINUTES = 720

// ---- Chart controls ----
const thMetric = ref('pm25')
const vocMetric = ref('voc')

const thRange = ref('24h') // 6h | 12h | 24h | 3d | 7d
const vocRange = ref('24h')

const thDays = computed(() => Math.max(1, Math.round(hoursFrom(thRange.value) / 24)))
const vocDays = computed(() => Math.max(1, Math.round(hoursFrom(vocRange.value) / 24)))

function hoursFrom(range) {
  if (range.endsWith('h')) return parseInt(range)
  if (range.endsWith('d')) return parseInt(range) * 24
  return 24
}

const baseId = computed(() => String(route.params.id || '').trim())
const thId = computed(() => baseId.value ? thSiteOf(baseId.value) : null)
const vocId = computed(() => baseId.value ? vocSiteOf(baseId.value) : null)

const thChartEnabled = computed(() => !!latest.value.th)
const vocChartEnabled = computed(() => !!latest.value.voc)

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n % 1 === 0 ? n.toString() : n.toFixed(2)
}

watchEffect(async () => {
  loading.value = true
  try {
    if (!baseId.value) return

    const pin = MAP_DEVICES.find(p => p.id === baseId.value)
    if (!pin) {
      device.value = null
      return
    }

    const latestMap = await api.getLatestReadings({ hours: 24 })
    const th = latestMap[thId.value] || null
    const v  = latestMap[vocId.value] || null
    latest.value = { th, voc: v }

    const lastSeenMs = Math.max(
      Number.isFinite(th?.lastSeenMs) ? th.lastSeenMs : 0,
      Number.isFinite(v?.lastSeenMs)  ? v.lastSeenMs  : 0
    ) || null

    let status = 'online'
    if (!lastSeenMs) status = 'offline'
    else if ((Date.now() - lastSeenMs) / 60000 > STALE_MINUTES) status = 'offline'

    device.value = {
      id: pin.id,
      name: pin.name,
      lat: pin.lat,
      lon: pin.lon,
      status,
      lastSeen: lastSeenMs
    }

    await Promise.all([reloadTH(), reloadVOC()])
  } finally {
    loading.value = false
  }
})

// Reactive reloads on control change
watch([thMetric, thRange], reloadTH)
watch([vocMetric, vocRange], reloadVOC)

async function reloadTH() {
  thSeriesByDevice.value = null
  if (!latest.value.th) return
  const hours = hoursFrom(thRange.value)
  const series = await api.getTimeseriesByMetric({
    metric: thMetric.value,
    siteIds: [thId.value],
    hours
  })
  thSeriesByDevice.value = series
}

async function reloadVOC() {
  vocSeriesByDevice.value = null
  if (!latest.value.voc) return
  const hours = hoursFrom(vocRange.value)
  const series = await api.getTimeseriesByMetric({
    metric: vocMetric.value,
    siteIds: [vocId.value],
    hours
  })
  vocSeriesByDevice.value = series
}
</script>
