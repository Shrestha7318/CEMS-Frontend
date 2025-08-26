<template>
    <div class="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ title }}</h3>
            <slot name="controls" />
        </div>
        <div
            class="mt-4 aspect-[16/7] rounded-xl border border-dashed border-gray-300 dark:border-gray-700 grid place-items-center text-sm text-gray-500">
            Chart placeholder — integrate Chart.js, ECharts, or ApexCharts here.
        </div>
    </div>
</template>

<script setup>
defineProps({ title: String })
</script>