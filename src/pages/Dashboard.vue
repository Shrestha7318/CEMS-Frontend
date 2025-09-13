<template>
  <section class="space-y-6 pb-20 px-6">
    <div class="flex items-baseline justify-between">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <RouterLink to="/devices" class="text-sm hover:underline text-emerald-600">See all devices →</RouterLink>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Average AQI" :value="summary?.avgAQI ?? '—'" unit="" :delta="delta.aqi" caption="24h change" />
      <StatCard label="Sensors Online" :value="summary?.online ?? '—'" :delta="delta.online" caption="Up since yesterday" />
      <StatCard label="Total Sensors" :value="summary?.sensorCount ?? '—'" :delta="0" caption="All registered" />
      <StatCard label="Active Alerts" :value="summary?.alerts ?? '—'" :delta="delta.alerts" caption="AQI > 100" />
    </div>

    <DevicesMap :devices="devices" />

    <!-- Compare section -->
    <div class="space-y-4">

      <div class="space-y-4">
        <ComparePanel
          v-for="(p, idx) in comparePanels"
          :key="p.uid"
          :uid="p.uid"
          :display-id="idx + 1"                
          :devices="devices"
          :can-remove="comparePanels.length > 1 && idx > 0"  
          @remove="removePanel"
        />
      </div>

      <div class="pt-2">
        <button
          type="button"
          @click="addPanel"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500 dark:hover:bg-emerald-900/20 text-sm"
        >
          <span class="text-lg leading-none">＋</span>
          Add comparison
        </button>
      </div>
    </div>

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
import DevicesMap from '@/components/DevicesMap.vue'
import ComparePanel from '@/components/ComparePanel.vue'

const summary = ref(null)
const delta = ref({ aqi: 4, alerts: -12, online: 3 })
const seriesData = ref([])
const devices = ref([])

/** Compare manager */
let nextUid = 1
const comparePanels = ref([{ uid: nextUid++ }])

function addPanel() {
  comparePanels.value.push({ uid: nextUid++ })
}

function removePanel(uid) {
  if (comparePanels.value.length <= 1) return // enforce at least one
  comparePanels.value = comparePanels.value.filter(p => p.uid !== uid)
}

onMounted(async () => {
  devices.value = await api.getSensors('')
  const sensors = await api.getSensors('')
  if (sensors.length) {
    seriesData.value = await api.getSensorTimeseries(sensors[1].id, { period: '2d', interval: '5m' })
  }
})
</script>
