<template>
  <section class="space-y-14 pb-24">
    <!-- Hero -->
    <div class="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 p-8 md:p-12 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div class="max-w-3xl">
        <p class="text-sm uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Coastal Environmental Monitoring</p>
        <h1 class="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          CEMS — real-time air & seawater monitoring for coastal communities
        </h1>
        <p class="mt-4 text-gray-600 dark:text-gray-300">
          Low-cost sensing units stream data to a secure server, so you can visualize trends, compare sites, and act quickly when thresholds are exceeded.
        </p>

        <div class="mt-6 flex items-center gap-3">
          <RouterLink
            to="/devices"
            class="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
            Explore devices
          </RouterLink>
          <RouterLink
            to="/dashboard"
            class="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            View dashboard
          </RouterLink>
        </div>

        <!-- Mini trust row -->
        <div class="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- Subtle hero art -->
      <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-30 bg-emerald-300/40 dark:bg-emerald-700/20 pointer-events-none"></div>
    </div>

    <!-- Live map preview -->
    <div>
      <h2 class="text-xl font-semibold mb-3">Live map</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Pan and zoom to explore monitoring sites. Click a marker for quick stats and deep links.
      </p>
      <DevicesMap :devices="devices" :center="center" :zoom="zoom" />
    </div>

    <!-- Key value props -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 class="font-medium">Built for the coast</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Hybrid connectivity and ruggedized units maintain data flow despite humidity, wind, and distance between sites.
        </p>
      </div>
      <div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 class="font-medium">Low-power, low-cost</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          LoRaWAN reduces power draw and infrastructure needs, keeping deployments affordable and scalable.
        </p>
      </div>
      <div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 class="font-medium">Open & extensible</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Standards-based RS-485 sensors and an API-ready server let you integrate new metrics and tools easily.
        </p>
      </div>
    </div>

    <!-- What we measure -->
    <div>
      <h2 class="text-xl font-semibold mb-3">What we measure</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Air Quality" :items="['AQI','PM2.5','PM10','NO₂','SO₂','O₃','CO₂','Temp','Humidity']" />
        <MetricCard label="Seawater" :items="['Dissolved Oxygen','Salinity','Sea Level','Water Temp','pH']" />
        <MetricCard label="System Health" :items="['RSSI','Uptime','Battery / Power']" />
      </div>
    </div>

    <!-- How it works -->
    <div>
      <h2 class="text-xl font-semibold mb-3">How it works</h2>
      <ol class="grid md:grid-cols-3 gap-4 list-decimal list-inside text-sm">
        <li class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <b>CEMU sensors</b> capture air & seawater data via RS-485 and analog inputs inside an IP-rated enclosure.
        </li>
        <li class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <b>LoRaWAN uplink</b> sends readings to a gateway; ChirpStack decodes payloads and stores them in PostgreSQL.
        </li>
        <li class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <b>Portal & API</b> render maps, charts, and comparisons—plus CSV/PNG exports for reports.
        </li>
      </ol>
    </div>

    <!-- CTA -->
    <div class="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h3 class="font-semibold">Ready to explore live data?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Jump into the dashboard or browse all devices.</p>
      </div>
      <div class="flex gap-3">
        <RouterLink to="/dashboard" class="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Open dashboard</RouterLink>
        <RouterLink to="/devices" class="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">View devices</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DevicesMap from '@/components/DevicesMap.vue'
import MetricCard from '@/components/MetricCard.vue'
import { api } from '@/services/api'

const devices = ref([])
const center = ref([27.8767, -97.3231]) // default center (Corpus Christi area)
const zoom = ref(10)

onMounted(async () => {
  try {
    devices.value = await api.getSensors('')
    // Auto-center if we have devices with coordinates
    const first = devices.value.find(d => Number.isFinite(d.lat) && Number.isFinite(d.lon))
    if (first) center.value = [first.lat, first.lon]
  } catch (e) {
    console.warn('Failed to load devices', e)
  }
})
</script>
