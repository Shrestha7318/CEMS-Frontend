<template>
  <div
    class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden">
    <!-- Top bar -->
    <div class="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <input
          v-model="search"
          type="text"
          placeholder="Search by ID or location..."
          class="w-full sm:w-72 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent outline-none" />

        <!-- Refresh button (background refresh) -->
        <button
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-white
                 bg-blue-600 dark:border-gray-700
                 hover:bg-blue-500 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="refreshing"
          @click="refresh">
          <svg v-if="refreshing" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <span>{{ refreshing ? 'Refreshing…' : 'Refresh' }}</span>
        </button>
      </div>

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

            <th class="px-4 py-3 text-right">
              PM2.5 <span class="opacity-60 font-normal">(µg/m³)</span>
            </th>
            <th class="px-4 py-3 text-right">
              PM10 <span class="opacity-60 font-normal">(µg/m³)</span>
            </th>

            <th class="px-4 py-3 text-right">
              VOC <span class="opacity-60 font-normal">(ppm)</span>
            </th>
            <th class="px-4 py-3 text-right">
              O₃ <span class="opacity-60 font-normal">(ppm)</span>
            </th>
            <th class="px-4 py-3 text-right">
              NO₂ <span class="opacity-60 font-normal">(ppm)</span>
            </th>
            <th class="px-4 py-3 text-right">
              SO₂ <span class="opacity-60 font-normal">(ppm)</span>
            </th>

            <th class="px-4 py-3 text-right">
              Temp <span class="opacity-60 font-normal">(°F)</span>
            </th>
            <th class="px-4 py-3 text-right">
              RH <span class="opacity-60 font-normal">(%)</span>
            </th>

            <th class="px-4 py-3 text-right hidden md:table-cell">
              Noise <span class="opacity-60 font-normal">(dB)</span>
            </th>

            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Last Seen</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="[&>tr>td]:tabular-nums">
          <tr v-for="s in filtered" :key="s.id" class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-4 py-3 font-mono">
              <RouterLink :to="{ name: 'devices', query: { id: s.id } }" class="hover:underline">
                {{ s.id }}
              </RouterLink>
            </td>
            <td class="px-4 py-3">
              <RouterLink :to="{ name: 'devices', query: { id: s.id } }" class="hover:underline">
                {{ s.name || '—' }}
              </RouterLink>
            </td>

            <!-- Values only (no units in cells) -->
            <td class="px-4 py-3 text-right">{{ isNumber(s.pm25) ? s.pm25 : '—' }}</td>
            <td class="px-4 py-3 text-right">{{ isNumber(s.pm10) ? s.pm10 : '—' }}</td>

            <td class="px-4 py-3 text-right">{{ isNumber(s.voc) ? s.voc : '—' }}</td>
            <td class="px-4 py-3 text-right">{{ isNumber(s.o3) ? s.o3 : '—' }}</td>
            <td class="px-4 py-3 text-right">{{ isNumber(s.no2) ? s.no2 : '—' }}</td>
            <td class="px-4 py-3 text-right">{{ isNumber(s.so2) ? s.so2 : '—' }}</td>

            <td class="px-4 py-3 text-right">{{ isNumber(s.tempC) ? s.tempC.toFixed(1) : '—' }}</td>
            <td class="px-4 py-3 text-right">{{ isNumber(s.rh) ? s.rh.toFixed(0) : '—' }}</td>

            <td class="px-4 py-3 text-right hidden md:table-cell">{{ isNumber(s.noise) ? s.noise : '—' }}</td>

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
              <RouterLink :to="{ name: 'devices', query: { id: s.id } }" class="text-emerald-600 hover:underline">
                View
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
import { MAP_DEVICES } from '@/constants/mapSites.js'

const search = ref('')
const loading = ref(false)
const refreshing = ref(false) 
const error = ref('')
const rows = ref([])
const STALE_MINUTES = 120 // mark offline if older than this
const BASE_TO_NAME = Object.fromEntries(MAP_DEVICES.map(d => [d.id, d.name]))

onMounted(() => load({ background: false }))

/** Background-safe refresh button handler */
async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await load({ background: true, forceNetwork: true })
  } finally {
    refreshing.value = false
  }
}

/** Load/merge logic (shared by initial load + refresh) */
async function load({ background = false, forceNetwork = false } = {}) {
  if (!background) {
    loading.value = true
    error.value = ''
  }
  try {
    // 1) Sites list (api.getSites() already does cache-first)
    const siteNames = await api.getSites()

    // 2) Latest readings
    // - initial load: reuse your fast cache path (freshMs=10min, refresh:true)
    // - manual refresh: force network (freshMs=0) and still let API write-through the cache
    const latestBySite = await api.getLatestReadings({
      hours: 24,
      freshMs: forceNetwork ? 0 : 10 * 60 * 1000,
      refresh: true
    })

    // 3) Merge rows
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
        id: baseId, name: BASE_TO_NAME[baseId] ?? baseId,
        pm25, pm10, voc: vocVal, o3, no2, so2, tempC, rh, noise, illum,
        status,
        lastSeen: lastSeenMs,
        lastSeenUtc
      })
    }
    rows.value = merged.sort((a, b) => a.id.localeCompare(b.id))
  } catch (e) {
    console.error('SensorTable load failed:', e?.response?.data ?? e)
    if (!background) {
      error.value = `Failed to load devices: ${e?.response?.status ?? e?.message ?? 'unknown'}`
    }
  } finally {
    if (!background) loading.value = false
  }
}

function baseFromSite(site) {
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
      obj[k?.toLowerCase?.()] ??
      obj[k?.toUpperCase?.()]
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
