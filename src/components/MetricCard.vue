<template>
  <div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="font-medium">{{ label }}</h3>

    <!-- Accepts either array of strings OR array of { label, value, unit } -->
    <ul class="mt-2 text-sm text-gray-600 dark:text-gray-300 grid grid-cols-2 gap-x-3 gap-y-1">
      <li v-for="(it, idx) in items" :key="idx">
        <template v-if="isObject(it)">
          • <span class="text-gray-800 dark:text-gray-100 font-medium">{{ it.label }}</span>:
          <span>{{ formatValue(it.value) }}<span v-if="it.unit"> {{ it.unit }}</span></span>
        </template>
        <template v-else>
          • {{ it }}
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  // items: string[] | {label: string, value: number|string, unit?: string}[]
  items: { type: Array, default: () => [] }
})

const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v)
function formatValue(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? (Math.abs(n) >= 100 ? Math.round(n) : +n.toFixed(2)) : String(v)
}
</script>
