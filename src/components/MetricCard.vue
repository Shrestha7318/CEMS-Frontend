<template>
  <div class="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="font-medium">{{ label }}</h3>
    <ul class="mt-2 text-sm text-gray-600 dark:text-gray-300 grid grid-cols-2 gap-x-3 gap-y-1">
      <li v-for="(i,idx) in items" :key="idx">• {{ i }}</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ label: String, items: { type: Array, default: () => [] } })
</script>
