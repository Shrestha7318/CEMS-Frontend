<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm text-gray-600 dark:text-gray-300">Metric</label>
    <select
      class="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
      :value="modelValue"
      @change="e => emit('update:modelValue', e.target.value)"
    >
      <option v-for="m in options" :key="m.key" :value="m.key">{{ m.label }}</option>
    </select>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: String, default: 'aqi' } })
const emit = defineEmits(['update:modelValue'])
const options = [
  { key: 'aqi', label: 'AQI' },
  { key: 'pm25', label: 'PM2.5 (µg/m³)' },
  { key: 'pm10', label: 'PM10 (µg/m³)' },
  { key: 'co2', label: 'CO₂ (ppm)' },
  { key: 'temp', label: 'Temperature (°C)' },
  { key: 'humidity', label: 'Humidity (%)' },
]
</script>
