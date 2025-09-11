<template>
  <div
    class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden">
    <!-- Top bar -->
    <div class="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <input v-model="search" type="text" placeholder="Search by ID or name..."
        class="w-full sm:w-72 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent outline-none" />
      <div class="text-sm text-gray-500 dark:text-gray-400">Total: {{ filtered.length }}</div>
    </div>

    <div v-if="loading" class="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">Loading devices…</div>
    <div v-else-if="error" class="px-4 pb-4 text-sm text-rose-600">{{ error }}</div>
    <div v-else-if="!filtered.length" class="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">No devices found.</div>

    <div class="overflow-x-auto" v-if="!loading && !error && filtered.length">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/40">
          <tr class="text-left">
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">AQI</th>
            <th class="px-4 py-3">PM2.5</th>
            <th class="px-4 py-3">VOC</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Last Seen</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-4 py-3 font-mono">{{ s.id }}</td>
            <td class="px-4 py-3">{{ s.name || '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg" :class="aqiBadge(s.aqi)">
                {{ isNumber(s.aqi) ? s.aqi : '—' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ isNumber(s.pm25) ? `${s.pm25} µg/m³` : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.voc) ? s.voc : '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg" :class="{
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': s.status === 'online',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': s.status === 'warning',
                'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300': s.status === 'offline'
              }">
                {{ s.status || '—' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ s.lastSeen ? new Date(s.lastSeen).toLocaleString() : '—' }}</td>
            <td class="px-4 py-3">
              <RouterLink :to="`/devices/${encodeURIComponent(s.id)}`" class="text-emerald-600 hover:underline">View</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * - Groups TH + VOC by base id (UTIS####)
 * - Shows PM2.5 (TH) and VOC (VOC)
 * - Computes AQI from PM2.5
 * - Uses ms timestamps for Last Seen
 */
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '@/services/api'   // ✅ import api (needed)

const search = ref('')
const loading = ref(false)
const error = ref('')
const rows = ref([])
const STALE_MINUTES = 720 // mark offline if older than this

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const siteNames = await api.getSites()
    const latestBySite = await api.getLatestReadings({ hours: 24 })

    // group by base id and merge TH + VOC
    const byBase = new Map()
    for (const siteName of siteNames) {
      const baseId = baseFromSite(siteName)
      if (!byBase.has(baseId)) byBase.set(baseId, { th: null, voc: null })
      const bucket = byBase.get(baseId)
      const latest = latestBySite[siteName] || null
      if (siteName.includes('-TH-')) bucket.th = latest
      if (siteName.includes('-VOC-')) bucket.voc = latest
    }

    const merged = []
    for (const [baseId, { th, voc }] of byBase) {
      const pm25 = th?.pm25 ?? null
      const aqi  = isNumber(pm25) ? aqiFromPM25(pm25) : null
      const vocVal = voc?.voc ?? null

      const lastSeenMs = Math.max(
        Number.isFinite(th?.lastSeenMs) ? th.lastSeenMs : 0,
        Number.isFinite(voc?.lastSeenMs) ? voc.lastSeenMs : 0
      ) || null

      let status = 'online'
      if (!lastSeenMs) {
        status = 'offline'
      } else {
        const ageMin = (Date.now() - lastSeenMs) / 60000
        if (ageMin > STALE_MINUTES) status = 'offline'
      }

      merged.push({ id: baseId, name: baseId, aqi, pm25, voc: vocVal, status, lastSeen: lastSeenMs })
    }
    rows.value = merged.sort((a, b) => a.id.localeCompare(b.id))
  } catch (e) {
    console.error('SensorTable load failed:', e?.response?.data ?? e)
    error.value = `Failed to load devices: ${e?.response?.status ?? e?.message ?? 'unknown'}`
  } finally {
    loading.value = false
  }
}

function baseFromSite(site) {
  return String(site).split('-')[0]
}

// search (debounced)
const debounced = ref('')
let t
watch(search, (v) => {
  clearTimeout(t)
  t = setTimeout(() => (debounced.value = (v || '').toLowerCase().trim()), 200)
})
const filtered = computed(() => {
  if (!debounced.value) return rows.value
  return rows.value.filter((r) =>
    String(r.id).toLowerCase().includes(debounced.value) ||
    String(r.name).toLowerCase().includes(debounced.value)
  )
})

// helpers
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
function isNumber(v) { return typeof v === 'number' && Number.isFinite(v) }
function aqiBadge(aqi) {
  if (!isNumber(aqi)) return 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300'
  if (aqi <= 50)  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (aqi <= 100) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
}
</script>
