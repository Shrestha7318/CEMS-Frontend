<template>
  <div class="rounded-2xl border overflow-hidden">
    <l-map style="height: 400px; width: 100%;" :zoom="zoom" :center="center">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"
      />
      <l-marker v-for="p in pins" :key="p.id" :lat-lng="[p.lat, p.lon]">
        <l-popup>
          <div class="space-y-2">
            <div class="font-semibold">{{ p.name }}</div>

            <!-- status row -->
            <div class="flex items-center gap-2 text-xs">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :class="dotClass(statusById[p.id]?.status)"
              />
              <span class="capitalize">{{ statusById[p.id]?.status || 'unknown' }}</span>
            </div>

            <!-- last seen row -->
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Last seen:
              <span :title="fullTime(statusById[p.id]?.lastSeen)">
                {{ relativeTime(statusById[p.id]?.lastSeen) }}
              </span>
            </div>

            <router-link
              :to="{ name: 'devices', query: { id: p.id } }"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl
                     border border-gray-300 dark:border-gray-700
                     bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800
                     text-xs">
              Open →
            </router-link>
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"
import { MAP_DEVICES as pins } from "@/constants/mapSites"
import { api } from "@/services/api"

defineProps({
  center: { type: Array, default: () => [27.8800, -97.2100] },
  zoom:   { type: Number, default: 11 }
})

/* ---- status + last seen (same logic as your table) ---- */
const STALE_MINUTES = 60
const statusById = ref({}) // { [baseId]: { status, lastSeen } }

onMounted(loadStatus)

async function loadStatus() {
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
      if (siteName.includes("-TH-")) bucket.th = latest
      if (siteName.includes("-VOC-")) bucket.voc = latest
    }

    const map = {}
    for (const [baseId, { th, voc }] of byBase) {
      const thMs  = toMs(th?.lastSeenMs ?? th?.reportedUTC ?? th?.receivedUTC)
      const vocMs = toMs(voc?.lastSeenMs ?? voc?.reportedUTC ?? voc?.receivedUTC)
      const lastSeen = Math.max(thMs || 0, vocMs || 0) || null

      let status = "online"
      if (!lastSeen) status = "offline"
      else if ((Date.now() - lastSeen) / 60000 > STALE_MINUTES) status = "offline"

      map[baseId] = { status, lastSeen }
    }
    statusById.value = map
  } catch (e) {
    console.error("DeviceMap status load failed:", e?.response?.data ?? e)
  }
}

/* ---- helpers ---- */
function baseFromSite(site) {
  // "UTIS0001-TH-V6_1" -> "UTIS0001"
  return String(site).split("-")[0]
}
function toMs(v) {
  if (!v) return 0
  if (typeof v === "number" && Number.isFinite(v)) return v
  const ms = Date.parse(v)
  return Number.isFinite(ms) ? ms : 0
}
function relativeTime(ms) {
  if (!ms) return "unknown"
  const diff = Math.max(0, Date.now() - ms)
  const m = Math.round(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}
function fullTime(ms) {
  return ms ? new Date(ms).toLocaleString() : ""
}
function dotClass(status) {
  switch (status) {
    case "online":  return "bg-emerald-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(17,24,39,1)]"
    case "warning": return "bg-amber-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(17,24,39,1)]"
    case "offline": return "bg-rose-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(17,24,39,1)]"
    default:        return "bg-gray-400 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(17,24,39,1)]"
  }
}
</script>
