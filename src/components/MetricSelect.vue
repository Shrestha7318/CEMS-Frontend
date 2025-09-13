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
import { METRIC_OPTIONS } from '@/constants/metrics'
const props = defineProps({ modelValue: { type: String, default: 'pm25' } })
const emit = defineEmits(['update:modelValue'])
const options = METRIC_OPTIONS
</script>
