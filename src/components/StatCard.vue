<template>
    <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft">
        <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ label }}</p>
            <span class="text-xs px-2 py-0.5 rounded-full"
                :class="delta >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'">
                {{ delta >= 0 ? '▲' : '▼' }} {{ Math.abs(delta) }}%
            </span>
        </div>
        <div class="mt-2 flex items-end gap-2">
            <h3 class="text-2xl font-semibold">{{ value }}</h3>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ unit }}</span>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ caption }}</p>
    </div>
</template>

<script setup>
defineProps({
    label: String,
    value: [String, Number],
    unit: { type: String, default: '' },
    delta: { type: Number, default: 0 },
    caption: { type: String, default: '' }
})
</script>
