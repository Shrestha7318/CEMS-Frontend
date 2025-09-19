<template>
    <section class="space-y-6">
        <!-- Top picker  -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold">Devices</h1>
            <div class="flex gap-2 overflow-x-auto py-1">
                <button v-for="p in pins" :key="p.id" class="px-3 py-1.5 rounded-xl border text-sm whitespace-nowrap transition
                 border-gray-300 dark:border-gray-700" :class="p.id === selectedId
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    @click="selectDevice(p.id)">
                    {{ p.name }}
                </button>
            </div>
        </div>

        <!-- Header -->
        <div v-if="device && !loadingSeries"
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

        <!-- Header skeleton while loading -->
        <div v-else class="rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-5">
            <div class="animate-pulse space-y-3">
                <div class="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div class="h-4 w-80 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        </div>

        <!-- Main split: left panel + right map  -->
        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Left: readings card / skeleton -->
            <div class="relative rounded-2xl border bg-white dark:bg-gray-900 p-4 min-h-[420px]">
                <h2 class="font-semibold mb-2">
                    Recent Readings <span class="text-sm text-gray-500">(past 24 hours)</span>
                </h2>

                <!-- Loading skeleton -->
                <div v-if="loadingSeries" class="mt-6 animate-pulse space-y-4">
                    <div class="h-6 w-40 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
                    <div class="h-40 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
                        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
                        <div class="h-16 bg-gray-200/80 dark:bg-gray-800/70 rounded"></div>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else-if="rows.length === 0" class="mt-24 text-center text-gray-500 dark:text-gray-400">
                    No data in the past 24 hours.
                </div>

                <!-- Actual metric card -->
                <DeviceMetricCard v-else :busy="loadingSeries" :rows="rows" :expandedKeys="expandedKeys"
                    :baseId="selectedId" @toggle="toggleExpand" />
            </div>

            <!-- Right: map with spinner overlay -->
            <div class="relative rounded-2xl border overflow-hidden min-h-[420px]">
                <div v-if="loadingSeries"
                    class="absolute inset-0 z-10 grid place-items-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                    <svg class="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>

                <DevicesSelectMap :center="[27.8800, -97.2100]" :zoom="11" :pins="pins" :selectedId="selectedId"
                    class="rounded-2xl border-0" style="height: 400px" @select="selectDevice" />
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { api } from '@/services/api'
import { MAP_DEVICES as pins, thSiteOf, vocSiteOf } from '@/constants/mapSites'
import DeviceMetricCard from '@/components/DeviceMetricCard.vue'
import DevicesSelectMap from '../components/DevicesSelectMap.vue'
import { useRoute, useRouter } from 'vue-router'

import { idbGet, idbSet } from '@/utils/idb'   // tolerant readers below
import { preloadDevicesPage } from '@/preload/devicesWarmup' // your warmup util


/* --------------------------- Router state --------------------------- */
const route = useRoute()
const router = useRouter()
const selectedId = ref(String(route.query.id || pins[0]?.id || ''))

// --- background “trickle” warmer (no UI) ---
function warmOtherDevices(exceptId) {
    // Respect user’s data-saver / slow network automatically (the util already does)
    const remaining = pins.filter(d => d.id !== exceptId)
    if (!remaining.length) return

    // Avoid re-warming the same ids repeatedly during this session
    window.__warmedIds ??= new Set()

    const toWarm = remaining.filter(d => !window.__warmedIds.has(d.id))
    if (!toWarm.length) return

    // Trickle with small concurrency; run when the main thread is idle-ish
    const schedule = (fn) =>
    (window.requestIdleCallback
        ? requestIdleCallback(() => fn(), { timeout: 2000 })
        : setTimeout(fn, 0))

    schedule(async () => {
        // Warm everything except the selected, with gentle concurrency.
        await preloadDevicesPage({
            devices: toWarm,           // only the leftovers
            count: toWarm.length,      // warm them all
            concurrency: 2             // stay gentle; 2–3 is a good balance
        }).catch(() => { })

        toWarm.forEach(d => window.__warmedIds.add(d.id))
    })
}

watch(() => route.query.id, (id) => {
    if (id && id !== selectedId.value) selectedId.value = String(id)
})
watch(selectedId, (id) => {
    if (!id) return
    router.replace({ name: 'devices', query: { ...route.query, id } })
})

/* --------------------------- Local state ---------------------------- */
const device = ref(null)
const latest = ref({ th: null, voc: null })
const loadingSeries = ref(true)
const expandedKeys = ref([])
const rows = ref([])

const STALE_MINUTES = 720           // for online/offline badge
const LATEST_TTL_MS = 30 * 60 * 1000 // use cached latest up to 30 min
const ROWS_TTL_MS = 30 * 60 * 1000 // use cached rows up to 30 min

/* --------------------------- Cache keys ----------------------------- */
const ROWS_VERSION = 'v1'
const HOURS = 24
const rowsKey = (id) => `rows:${id}:${HOURS}h:${ROWS_VERSION}`
const latestKey = (id) => `latest:${id}`

/* ---------------------- UI / helpers ---------------------- */
function toggleExpand(key) {
    const i = expandedKeys.value.indexOf(key)
    if (i >= 0) expandedKeys.value.splice(i, 1)
    else expandedKeys.value.push(key)
}

function selectDevice(id) {
    if (selectedId.value === id) return
    selectedId.value = id
}

function toMs(v) {
    if (!v) return 0
    if (typeof v === 'number' && Number.isFinite(v)) return v
    const ms = Date.parse(v)
    return Number.isFinite(ms) ? ms : 0
}

/* ------------- tolerant cache readers (mixed shapes safe) ----------- */
async function readCachedLatest(id) {
    // can be { latest, cachedAt } OR { data, savedAt }
    const raw = await idbGet(latestKey(id))
    if (!raw) return null
    if (raw.latest) return { latest: raw.latest, cachedAt: raw.cachedAt ?? 0 }
    if (raw.data) return { latest: raw.data, cachedAt: raw.savedAt ?? 0 }
    return null
}

async function readCachedRows(id) {
    const raw = await idbGet(rowsKey(id))
    if (!raw) return null
    if (raw.rows) return { rows: raw.rows, cachedAt: raw.cachedAt ?? 0 }
    if (raw.data) return { rows: raw.data, cachedAt: raw.savedAt ?? 0 }
    return null
}

/* -------------------- Build header/device object -------------------- */
function buildDeviceFromLatest(id, th, voc) {
    const pin = pins.find(p => p.id === id)
    const thMs = toMs(th?.lastSeenMs ?? th?.reportedUTC ?? th?.receivedUTC)
    const vocMs = toMs(voc?.lastSeenMs ?? voc?.reportedUTC ?? voc?.receivedUTC)
    const lastSeenMs = Math.max(thMs || 0, vocMs || 0) || null
    let status = 'online'
    if (!lastSeenMs) status = 'offline'
    else if ((Date.now() - lastSeenMs) / 60000 > STALE_MINUTES) status = 'offline'
    return { ...pin, status, lastSeen: lastSeenMs }
}

/* ------------------------ Build rows from API ----------------------- */
function buildRowsFromSeries(id, thSeries, vocSeries) {
    const pick = (seriesObj, isTH, key) => {
        const arr = isTH ? (seriesObj?.[thSiteOf(id)] || []) : (seriesObj?.[vocSiteOf(id)] || [])
        return (arr || []).map(d => ({ ts: d.ts, value: d.value ?? d[key] }))
    }
    const makeRow = (isTH, key, label, unit, s) => ({ key, label, unit, points: s ? pick(s, isTH, key) : [] })
    const labels = {
        pm25: 'PM2.5', pm10: 'PM10', temperature: 'Temp', humidity: 'Humidity',
        noise: 'Noise', illumination: 'Illumination', voc: 'VOC', o3: 'O₃', so2: 'SO₂', no2: 'NO₂'
    }
    const units = {
        pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°C', humidity: '%',
        noise: 'dB', illumination: 'lx', voc: 'ppm', o3: 'ppm', so2: 'ppm', no2: 'ppm'
    }
    const out = []
    out.push(makeRow(true, 'pm25', labels.pm25, units.pm25, thSeries[0]))
    out.push(makeRow(true, 'pm10', labels.pm10, units.pm10, thSeries[1]))
    out.push(makeRow(true, 'temperature', labels.temperature, units.temperature, thSeries[2]))
    out.push(makeRow(true, 'humidity', labels.humidity, units.humidity, thSeries[3]))
    out.push(makeRow(true, 'noise', labels.noise, units.noise, thSeries[4]))
    out.push(makeRow(true, 'illumination', labels.illumination, units.illumination, thSeries[5]))
    out.push(makeRow(false, 'voc', labels.voc, units.voc, vocSeries[0]))
    out.push(makeRow(false, 'o3', labels.o3, units.o3, vocSeries[1]))
    out.push(makeRow(false, 'so2', labels.so2, units.so2, vocSeries[2]))
    out.push(makeRow(false, 'no2', labels.no2, units.no2, vocSeries[3]))
    return out.filter(r => (r.points?.length || 0) > 0)
}

/* ---------------------- Main load sequence -------------------------- */
async function loadFromCacheFirstThenRefresh() {
    const id = selectedId.value
    if (!id) return

    // 1) Try cache (instant paint)
    const [cachedLatest, cachedRows] = await Promise.all([
        readCachedLatest(id),
        readCachedRows(id)
    ])

    const latestFreshEnough = cachedLatest && (Date.now() - cachedLatest.cachedAt) <= LATEST_TTL_MS
    const rowsFreshEnough = cachedRows && (Date.now() - cachedRows.cachedAt) <= ROWS_TTL_MS

    if (cachedLatest) {
        latest.value = { th: cachedLatest.latest?.th ?? null, voc: cachedLatest.latest?.voc ?? null }
        device.value = buildDeviceFromLatest(id, latest.value.th, latest.value.voc)
    }
    if (cachedRows) {
        rows.value = cachedRows.rows || []
    }

    // If both are fresh enough, we can skip the spinner
    loadingSeries.value = !(latestFreshEnough && rowsFreshEnough)

    // 2) Always refresh in background and update UI + cache
    try {
        const fresh = await fetchFresh(id)
        applyFreshToUI(id, fresh)
        await writeFreshToCache(id, fresh)
    } finally {
        loadingSeries.value = false
    }
}

async function fetchFresh(id) {
    // latest
    const latestMap = await api.getLatestReadings({ hours: HOURS })
    const th = latestMap[thSiteOf(id)] || null
    const voc = latestMap[vocSiteOf(id)] || null

    // series
    const thMetrics = ['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination']
    const vocMetrics = ['voc', 'o3', 'so2', 'no2']
    const thPromises = thMetrics.map(metric => api.getTimeseriesByMetric({ metric, siteIds: [thSiteOf(id)], hours: HOURS }))
    const vocPromises = vocMetrics.map(metric => api.getTimeseriesByMetric({ metric, siteIds: [vocSiteOf(id)], hours: HOURS }))
    const [thSeries, vocSeries] = await Promise.all([Promise.all(thPromises), Promise.all(vocPromises)])

    return { latest: { th, voc }, rows: buildRowsFromSeries(id, thSeries, vocSeries) }
}

function applyFreshToUI(id, fresh) {
    latest.value = fresh.latest
    device.value = buildDeviceFromLatest(id, fresh.latest.th, fresh.latest.voc)
    rows.value = fresh.rows
}

async function writeFreshToCache(id, fresh) {
    await idbSet(latestKey(id), { latest: fresh.latest, cachedAt: Date.now() })
    await idbSet(rowsKey(id), { rows: fresh.rows, cachedAt: Date.now() })
}

/* --------------------------- Lifecycle ------------------------------ */
onMounted(async () => {
    // 0) Kick off background warmup (only once per session)
    if (!window.__devicesWarmupStarted) {
        window.__devicesWarmupStarted = true
        // don’t block the page paint
        setTimeout(() => preloadDevicesPage({ count: 4, concurrency: 2 }).catch(() => { }), 0)
    }

    await loadFromCacheFirstThenRefresh()
    // in onMounted after await loadFromCacheFirstThenRefresh()
    onMounted(async () => {
        if (!window.__devicesWarmupStarted) {
            window.__devicesWarmupStarted = true
            // Keep your first “small” warmup for a snappy feel (optional)
            setTimeout(() => preloadDevicesPage({ count: 4, concurrency: 2 }).catch(() => { }), 0)
        }

        await loadFromCacheFirstThenRefresh()

        // Now warm the rest quietly in the background
        warmOtherDevices(selectedId.value)
    })

    // also when user changes selection
    watch(selectedId, async (id) => {
        loadingSeries.value = true
        await loadFromCacheFirstThenRefresh()
        warmOtherDevices(id)
    })

})

watch(selectedId, async () => {
    loadingSeries.value = true
    await loadFromCacheFirstThenRefresh()
})
</script>
