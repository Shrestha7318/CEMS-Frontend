<template>
    <div class="relative inline-block text-left" ref="root">
        <button
            class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
            @click="open = !open">
            <span>{{ label }}</span>
            <svg class="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.157l3.71-3.93a.75.75 0 011.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd" />
            </svg>
        </button>

        <div v-if="open"
            class="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
            <ul class="py-1">
                <li v-for="o in options" :key="o.key">
                    <button
                        class="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        @click="select(o.key)">
                        <span class="inline-block h-2.5 w-2.5 rounded-full"
                            :class="isSelected(o.key) ? 'bg-emerald-500' : 'bg-gray-300'"></span>
                        <span>{{ o.label }}</span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ modelValue: { type: String, default: 'aqi' } })
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const root = ref(null)
const options = [
    { key: 'aqi', label: 'AQI' },
    { key: 'pm25', label: 'PM2.5 (µg/m³)' },
    { key: 'pm10', label: 'PM10 (µg/m³)' },
    { key: 'co2', label: 'CO₂ (ppm)' },
    { key: 'temp', label: 'Temperature (°C)' },
    { key: 'humidity', label: 'Humidity (%)' },
]
const label = computed(() => options.find(o => o.key === props.modelValue)?.label ?? 'Metric')
const isSelected = k => k === props.modelValue
function select(k) { emit('update:modelValue', k); open.value = false }
function onClickOutside(e) { if (!root.value) return; if (!root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
