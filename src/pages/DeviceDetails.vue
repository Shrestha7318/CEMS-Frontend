<template>
  <section class="space-y-6" v-if="device">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">{{ device.name }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ device.id }} • {{ device.status }}</p>
      </div>
      <RouterLink to="/devices" class="text-emerald-600 hover:underline">← Back to devices</RouterLink>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="AQI" :value="device.aqi" />
      <StatCard label="PM2.5" :value="device.pm25" unit="µg/m³" />
      <StatCard label="CO₂" :value="device.co2" unit="ppm" />
      <StatCard label="Temp" :value="device.temp" unit="°C" />
    </div>

    <!-- <TimeseriesChart v-if="seriesData.length" title="Timeseries" :data="seriesData"
          :metrics="['opm25', 'pm10', 'aqi']" /> -->
    <ComparePanel v-if="seriesData.length" :data="seriesData" />

    <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
      <h3 class="font-semibold mb-2">Metadata</h3>
      <ul class="text-sm text-gray-600 dark:text-gray-300 grid sm:grid-cols-2 gap-y-1">
        <li><b>Latitude:</b> {{ device.lat }}</li>
        <li><b>Longitude:</b> {{ device.lon }}</li>
        <li><b>Last Seen:</b> {{ new Date(device.lastSeen).toLocaleString() }}</li>
        <li><b>Status:</b> {{ device.status }}</li>
      </ul>
    </div>
  </section>

  <section v-else class="text-sm text-gray-500">Loading...</section>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import ComparePanel from '@/components/ComparePanel.vue'


const route = useRoute()
const device = ref(null)
const period = ref('24h')
const seriesData = ref([])

async function load() {
  const id = route.params.id
  device.value = await api.getSensorById(id)
  await api.getSensorTimeseries(id, period.value)
  seriesData.value = await api.getSensorTimeseries(id, { period: '2d', interval: '5m' })
}
watchEffect(load)
</script>
