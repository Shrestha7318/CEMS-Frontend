<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="text-sm text-gray-500">Metrics:</div>

    <label v-for="m in allMetrics" :key="m.key" class="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        :value="m.key"
        v-model="localSelected"
        class="rounded border-gray-300"
      />
      <span>{{ m.label }}</span>
    </label>

    <div class="ml-auto flex items-center gap-2">
      <button @click="emitDownload('png')" class="text-sm px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
        Download PNG
      </button>
      <button @click="emitDownload('csv')" class="text-sm px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
        Export CSV
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => ['pm25', 'pm10', 'aqi'] }
})
const emit = defineEmits(['update:modelValue', 'download'])

const allMetrics = [
  { key: 'aqi', label: 'AQI' },
  { key: 'pm25', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' },
  { key: 'co2', label: 'CO₂' },
  { key: 'temp', label: 'Temp (°C)' },
  { key: 'humidity', label: 'Humidity (%)' },
]

const localSelected = ref([...props.modelValue])

watch(localSelected, v => emit('update:modelValue', v), { deep: true })

function emitDownload(kind) {
  emit('download', kind)
}
</script>
