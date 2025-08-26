<template>
  <div
    class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden">
    <div class="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <input v-model="search" type="text" placeholder="Search by ID or name..."
        class="w-full sm:w-72 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent outline-none" />
      <div class="text-sm text-gray-500 dark:text-gray-400">Total: {{ filtered.length }}</div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/40">
          <tr class="text-left">
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">AQI</th>
            <th class="px-4 py-3">PM2.5</th>
            <th class="px-4 py-3">CO₂</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Last Seen</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id" class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-4 py-3 font-mono">{{ s.id }}</td>
            <td class="px-4 py-3">{{ s.name }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg" :class="aqiBadge(s.aqi)">
                {{ s.aqi }}
              </span>
            </td>
            <td class="px-4 py-3">{{ s.pm25 }} µg/m³</td>
            <td class="px-4 py-3">{{ s.co2 }} ppm</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg" :class="{
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': s.status === 'online',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': s.status === 'warning',
                'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300': s.status === 'offline'
              }">
                {{ s.status }}
              </span>
            </td>
            <td class="px-4 py-3">{{ new Date(s.lastSeen).toLocaleString() }}</td>
            <td class="px-4 py-3">
              <RouterLink :to="`/devices/${s.id}`" class="text-emerald-600 hover:underline">View</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { api } from '@/services/api'

const props = defineProps({ initialQuery: { type: String, default: '' } })
const search = ref(props.initialQuery)
const loading = ref(false)
const items = ref([])

async function load() {
  loading.value = true
  try {
    items.value = await api.getSensors(search.value)
  } finally {
    loading.value = false
  }
}
watchEffect(load)

const filtered = computed(() => items.value)

function aqiBadge(aqi) {
  if (aqi <= 50) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (aqi <= 100) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
}
</script>
