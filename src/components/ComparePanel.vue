<template>
    <section class="space-y-4">
        <CompareChart :seriesByDevice="seriesByDevice" :metric="metric" :days="days">
            <template #controls>
                <MetricDropdown v-model="metric" />
                <DeviceMultiDropdown :devices="devices" v-model="selectedDeviceIds" />
                <button
                    class="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    @click="reload" title="Refresh">
                    Refresh
                </button>
            </template>
        </CompareChart>
    </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '@/services/api'
import CompareChart from '@/components/CompareChart.vue'
import DeviceMultiDropdown from '@/components/DeviceMultiDropdown.vue'
import MetricDropdown from '@/components/MetricDropdown.vue'

const days = 3
const devices = ref([])
const selectedDeviceIds = ref([])
const metric = ref('aqi')
const seriesByDevice = ref({})

onMounted(async () => {
    devices.value = await api.getSensors('')
    selectedDeviceIds.value = devices.value.slice(0, 2).map(d => d.id)
    await reload()
})
watch([selectedDeviceIds, metric], reload)

async function reload() {
    if (!selectedDeviceIds.value.length) { seriesByDevice.value = {}; return }
    const ids = [...selectedDeviceIds.value]
    const results = await Promise.all(ids.map(id =>
        api.getSensorTimeseries(id, { days })
            .then(data => ({ id, data }))
            .catch(() => ({ id, data: [] }))
    ))
    const map = {}
    for (const { id, data } of results) map[id] = data
    seriesByDevice.value = map
}
</script>