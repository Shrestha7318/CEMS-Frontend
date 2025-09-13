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
            <th class="px-4 py-3">PM2.5</th>
            <th class="px-4 py-3">PM10</th>
            <th class="px-4 py-3">VOC</th>
            <th class="px-4 py-3">O₃</th>
            <th class="px-4 py-3">NO₂</th>
            <th class="px-4 py-3">SO₂</th>
            <th class="px-4 py-3">Temp</th>
            <th class="px-4 py-3">RH</th>
            <th class="px-4 py-3 hidden md:table-cell">Noise</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Last Seen</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-4 py-3 font-mono">{{ s.id }}</td>
            <td class="px-4 py-3">{{ s.name || '—' }}</td>

            <td class="px-4 py-3">{{ isNumber(s.pm25) ? `${s.pm25} µg/m³` : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.pm10) ? `${s.pm10} µg/m³` : '—' }}</td>

            <td class="px-4 py-3">{{ isNumber(s.voc) ? s.voc : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.o3) ? s.o3 : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.no2) ? s.no2 : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.so2) ? s.so2 : '—' }}</td>

            <td class="px-4 py-3">{{ isNumber(s.tempC) ? `${s.tempC.toFixed(1)} °C` : '—' }}</td>
            <td class="px-4 py-3">{{ isNumber(s.rh) ? `${s.rh.toFixed(0)} %` : '—' }}</td>

            <td class="px-4 py-3 hidden md:table-cell">{{ isNumber(s.noise) ? `${s.noise} dB` : '—' }}</td>

            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg" :class="{
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': s.status === 'online',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': s.status === 'warning',
                'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300': s.status === 'offline'
              }">
                {{ s.status || '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :title="s.lastSeen ? new Date(s.lastSeen).toLocaleString() : ''">
                {{ s.lastSeenUtc ? `${s.lastSeenUtc} CST` : '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <RouterLink :to="`/devices/${encodeURIComponent(s.id)}`" class="text-emerald-600 hover:underline">View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '@/services/api'

const search = ref('')
const loading = ref(false)
const error = ref('')
const rows = ref([])
const STALE_MINUTES = 60 // mark offline if older than this

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
    function pickUtcStr(row) {
      if (!row) return null
      const repMs = toMs(row.reportedUTC)
      const recMs = toMs(row.receivedUTC)
      if (!Number.isFinite(repMs) && !Number.isFinite(recMs)) return null
      return (repMs >= recMs ? row.reportedUTC : row.receivedUTC) || null
    }
    const merged = []
    for (const [baseId, { th, voc }] of byBase) {
      // Accept normalized keys (from your api.js) OR raw API keys
      const pm25 = pickNum(th, ['pm25', 'PM2_5'])
      const pm10 = pickNum(th, ['pm10', 'PM10'])
      const tempC = pickNum(th, ['tempC', 'Temperature'])
      const rh = pickNum(th, ['rh', 'Humidity'])
      const noise = pickNum(th, ['noise', 'Noise'])
      const illum = pickNum(th, ['illum', 'illumination', 'Illumination'])

      const vocVal = pickNum(voc, ['voc', 'VOC'])
      const o3 = pickNum(voc, ['o3', 'O3'])
      const so2 = pickNum(voc, ['so2', 'SO2'])
      const no2 = pickNum(voc, ['no2', 'NO2'])

      const thMs = toMs(th?.lastSeenMs ?? th?.reportedUTC ?? th?.receivedUTC)
      const vocMs = toMs(voc?.lastSeenMs ?? voc?.reportedUTC ?? voc?.receivedUTC)

      const lastSeenMs = Math.max(thMs || 0, vocMs || 0) || null
      const lastSeenUtc = (thMs >= vocMs ? pickUtcStr(th) : pickUtcStr(voc)) || null



      let status = 'online'
      if (!lastSeenMs) {
        status = 'offline'
      } else if ((Date.now() - lastSeenMs) / 60000 > STALE_MINUTES) {
        status = 'offline'
      }

      merged.push({
        id: baseId, name: baseId,
        pm25, pm10, voc: vocVal, o3, no2, so2, tempC, rh, noise, illum,
        status,
        lastSeen: lastSeenMs,        
        lastSeenUtc
      })
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
  // "UTIS0001-TH-V6_1" -> "UTIS0001"
  return String(site).split('-')[0]
}

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
function isNumber(v) { return typeof v === 'number' && Number.isFinite(v) }
function pickNum(obj, keys) {
  if (!obj) return null
  for (const k of keys) {
    const raw =
      obj[k] ??
      obj[k.toLowerCase?.()] ??
      obj[k.toUpperCase?.()]
    const n = typeof raw === 'string' ? parseFloat(raw) : raw
    if (typeof n === 'number' && Number.isFinite(n)) return n
  }
  return null
}

function toMs(v) {
  if (!v) return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const ms = Date.parse(v) 
  return Number.isFinite(ms) ? ms : 0
}
</script>
