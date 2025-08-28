<template>
  <section class="space-y-6 pb-20 px-6">
    <div class="flex items-baseline justify-between">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <RouterLink to="/devices" class="text-sm hover:underline text-emerald-600">See all devices →</RouterLink>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Average AQI" :value="summary?.avgAQI ?? '—'" unit="" :delta="delta.aqi" caption="24h change" />
      <StatCard label="Sensors Online" :value="summary?.online ?? '—'" :delta="delta.online"
        caption="Up since yesterday" />
      <StatCard label="Total Sensors" :value="summary?.sensorCount ?? '—'" :delta="0" caption="All registered" />
      <StatCard label="Active Alerts" :value="summary?.alerts ?? '—'" :delta="delta.alerts" caption="AQI > 100" />
    </div>
    <TimeseriesChart v-if="seriesData.length" title="Air Quality (Last 2 Days)" :data="seriesData"
      :metrics="['aqi', 'pm25', 'pm10']" />

    <div class="space-y-3">
      <h2 class="font-semibold">Recent Readings</h2>
      <SensorTable />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import StatCard from '@/components/StatCard.vue'
import SensorTable from '@/components/SensorTable.vue'
import TimeseriesChart from '@/components/TimeseriesChart.vue'


const summary = ref(null)
const delta = ref({ aqi: 4, alerts: -12, online: 3 })
const seriesData = ref([])


onMounted(async () => {
  const sensors = await api.getSensors('')
  if (sensors.length) {
    seriesData.value = await api.getSensorTimeseries(sensors[1].id, { period: '2d', interval: '5m' })
  }
})
</script>
