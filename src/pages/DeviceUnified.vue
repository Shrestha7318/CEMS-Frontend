<template>
    <section class="space-y-6">
        <!-- Top picker  -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold">Devices</h1>
            <div class="flex gap-2 overflow-x-auto py-1">
                <button v-for="p in pins" :key="p.id" class="px-3 py-1.5 rounded-xl border text-sm whitespace-nowrap transition
                 border-gray-300 dark:border-gray-700
                 hover:bg-gray-50 dark:hover:bg-gray-800" :class="p.id === selectedId
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-transparent text-gray-700 dark:text-gray-200'" @click="selectDevice(p.id)">
                    {{ p.name }}
                </button>
            </div>
        </div>

        <!-- Header -->
        <div v-if="device"
            class="rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 class="text-xl font-semibold">{{ device.name }}</h2>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span class="font-mono">{{ device.id }}</span>
                        <span>•</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs" :class="device.status === 'online'
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
            </div>
        </div>

        <!-- Main split: left panel + right map  -->
        <div class="grid lg:grid-cols-2 gap-6">
            <DeviceMetricCard :busy="loadingSeries" :rows="rows" :expandedKeys="expandedKeys" :baseId="selectedId" @toggle="toggleExpand" />

            <DevicesSelectMap :center="[27.8800, -97.2100]" :zoom="11" :pins="pins" :selectedId="selectedId"
                class="rounded-2xl border overflow-hidden" style="height: 400px" @select="selectDevice" />
        </div>
    </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { api } from '@/services/api'
import { MAP_DEVICES as pins } from '@/constants/mapSites'
import { thSiteOf, vocSiteOf } from '@/constants/mapSites'
import DeviceMetricCard from '@/components/DeviceMetricCard.vue'
import DevicesSelectMap from '../components/DevicesSelectMap.vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// initialize from ?id=… (fallback to first pin)
const selectedId = ref(String(route.query.id || pins[0]?.id || ''))

watch(() => route.query.id, (id) => {
  if (id && id !== selectedId.value) selectedId.value = String(id)
})

// when user changes marker selection, reflect it in the URL
watch(selectedId, (id) => {
  if (!id) return
  router.replace({ name: 'devices', query: { ...route.query, id } })
})

// const selectedId = ref(pins[0]?.id || null)
const device = ref(null)
const latest = ref({ th: null, voc: null })
const loadingSeries = ref(false)
const expandedKeys = ref([]) 

function toggleExpand(key) {
  const i = expandedKeys.value.indexOf(key)
  if (i >= 0) expandedKeys.value.splice(i, 1)
  else expandedKeys.value.push(key)
}

// rows the panel will render 
const rows = ref([])

// stale rule
const STALE_MINUTES = 720

function selectDevice(id) {
    if (selectedId.value === id) return
    selectedId.value = id
}

// load latest (for header status) + 24h timeseries for rows
async function loadDeviceAndSeries() {
    const id = selectedId.value
    if (!id) return
    // Header bits
    const pin = pins.find(p => p.id === id)
    const latestMap = await api.getLatestReadings({ hours: 24 })
    const th = latestMap[thSiteOf(id)] || null
    const v = latestMap[vocSiteOf(id)] || null
    latest.value = { th, voc: v }

    const lastSeenMs = Math.max(
        Number.isFinite(th?.lastSeenMs) ? th.lastSeenMs : 0,
        Number.isFinite(v?.lastSeenMs) ? v.lastSeenMs : 0
    ) || null
    let status = 'online'
    if (!lastSeenMs) status = 'offline'
    else if ((Date.now() - lastSeenMs) / 60000 > STALE_MINUTES) status = 'offline'
    device.value = { ...pin, status, lastSeen: lastSeenMs }

    // Build 24h series for the tiny bar rows (no drager)
    loadingSeries.value = true
    try {
        const hours = 24
        // TH metrics
        const thMetrics = ['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination']
        const thPromises = thMetrics.map(metric => api.getTimeseriesByMetric({
            metric, siteIds: [thSiteOf(id)], hours
        }))
        const thSeries = await Promise.all(thPromises)

        // VOC metrics 
        const vocMetrics = ['voc', 'o3', 'so2', 'no2']
        const vocPromises = vocMetrics.map(metric => api.getTimeseriesByMetric({
            metric, siteIds: [vocSiteOf(id)], hours
        }))
        const vocSeries = await Promise.all(vocPromises)

        // Shape rows [{ key, label, unit, points:[{ts,value}...] }]
        function pick(seriesObj, key) {
            const arr = seriesObj?.[thSiteOf(id)] || seriesObj?.[vocSiteOf(id)] || []
            return (arr || []).map(d => ({ ts: d.ts, value: d.value ?? d[key] }))
        }
        const makeRow = (key, label, unit, s) => ({ key, label, unit, points: pick(s, key) })

        const labels = {
            pm25: 'PM2.5', pm10: 'PM10',
            temperature: 'Temp', humidity: 'Humidity',
            noise: 'Noise', illumination: 'Illumination',
            voc: 'VOC', o3: 'O₃', so2: 'SO₂', no2: 'NO₂'
        }
        const units = {
            pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°C', humidity: '%', noise: 'dB',
            illumination: 'lx', voc: '', o3: '', so2: '', no2: ''
        }

        const packed = [
            makeRow('pm25', labels.pm25, units.pm25, thSeries[0]),
            makeRow('pm10', labels.pm10, units.pm10, thSeries[1]),
            makeRow('temperature', labels.temperature, units.temperature, thSeries[2]),
            makeRow('pressure', 'Pressure', 'hPa', null), 
            makeRow('humidity', labels.humidity, units.humidity, thSeries[3]),
            makeRow('noise', labels.noise, units.noise, thSeries[4]),
            makeRow('illumination', labels.illumination, units.illumination, thSeries[5]),
            makeRow('voc', labels.voc, units.voc, vocSeries[0]),
            makeRow('o3', labels.o3, units.o3, vocSeries[1]),
            makeRow('so2', labels.so2, units.so2, vocSeries[2]),
            makeRow('no2', labels.no2, units.no2, vocSeries[3]),
        ]
        // keep only rows that actually have data
        rows.value = packed.filter(r => (r.points?.length || 0) > 0)
    } finally {
        loadingSeries.value = false
    }
}

onMounted(loadDeviceAndSeries)
watch(selectedId, loadDeviceAndSeries)
</script>
