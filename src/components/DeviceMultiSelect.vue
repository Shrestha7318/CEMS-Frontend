<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm text-gray-600 dark:text-gray-300">Devices</label>
    <select
      multiple
      class="min-h-[120px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
      @change="onChange"
    >
      <option
        v-for="d in devices"
        :key="d.id"
        :value="d.id"
        :selected="modelValue.includes(d.id)"
      >
        {{ d.name }} ({{ d.id }})
      </option>
    </select>
    <p class="text-xs text-gray-500">Tip: Ctrl/Cmd-click to select multiple</p>
  </div>
</template>

<script setup>
const props = defineProps({
  devices: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

function onChange(e) {
  const selected = Array.from(e.target.selectedOptions).map(o => o.value)
  emit('update:modelValue', selected)
}
</script>
