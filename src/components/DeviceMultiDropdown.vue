<template>
  <div class="relative inline-block text-left" ref="root">
    <!-- Trigger -->
    <button type="button"
      class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
      @click="open = !open">
      <span class="truncate max-w-[200px]">
        Devices ({{ modelValue.length || 0 }})
      </span>
      <svg class="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.157l3.71-3.93a.75.75 0 011.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Panel -->
    <div v-if="open"
      class="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
      <!-- Search -->
      <div class="p-2 border-b border-gray-100 dark:border-gray-800">
        <input v-model="q" type="text" placeholder="Search devices…"
          class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 outline-none text-sm" />
      </div>

      <!-- List -->
      <ul class="max-h-64 overflow-auto py-1">
        <li class="px-2 py-1">
          <label
            class="flex items-center gap-2 text-sm px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input type="checkbox" :checked="allChecked" @change="toggleAll($event)" />
            <span class="font-medium">Select all</span>
          </label>
        </li>
        <li v-for="d in filtered" :key="d.id" class="px-2 py-1">
          <label
            class="flex items-center gap-2 text-sm px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            :title="d.id">
            <input type="checkbox" :value="d.id" :checked="modelValue.includes(d.id)"
              @change="onToggle(d.id, $event)" />
            <span class="truncate">{{ displayName(d) }}</span>
          </label>
        </li>
        <li v-if="!filtered.length" class="px-4 py-6 text-sm text-gray-500">No devices</li>
      </ul>

      <!-- Footer actions -->
      <div class="flex items-center justify-between gap-2 p-2 border-t border-gray-100 dark:border-gray-800">
        <button class="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          @click="clear">Clear</button>
        <!-- <button
          class="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          @click="open = false">Done</button> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { MAP_DEVICES } from '@/constants/mapSites.js'

const props = defineProps({
  devices: { type: Array, default: () => [] },   // [{ id, name?, locationName? ... }]
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const q = ref('')
const root = ref(null)


// Build lookup from TH/VOC site IDs → location name
const ID_TO_LOCATION = Object.fromEntries(
  MAP_DEVICES.flatMap(d => [
    [d.sites.th, d.name],
    [d.sites.voc, d.name],
  ])
)


function displayName(d) {
  return ID_TO_LOCATION[d.id] || d.name || d.id
}

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return props.devices
  return props.devices.filter(d => {
    const label = displayName(d).toLowerCase()
    return (
      label.includes(s) ||
      String(d.id).toLowerCase().includes(s)
    )
  })
})

const allChecked = computed(() =>
  filtered.value.length > 0 &&
  filtered.value.every(d => props.modelValue.includes(d.id))
)

function onToggle(id, evt) {
  const next = new Set(props.modelValue)
  if (evt.target.checked) next.add(id)
  else next.delete(id)
  emit('update:modelValue', Array.from(next))
}
function toggleAll(evt) {
  if (evt.target.checked) {
    const all = new Set(props.modelValue)
    filtered.value.forEach(d => all.add(d.id))
    emit('update:modelValue', Array.from(all))
  } else {
    const remain = props.modelValue.filter(id => !filtered.value.some(d => d.id === id))
    emit('update:modelValue', remain)
  }
}
function clear() {
  emit('update:modelValue', [])
}

function onClickOutside(e) {
  if (!root.value) return
  if (!root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
