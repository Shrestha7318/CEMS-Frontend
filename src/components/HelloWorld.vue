<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ msg }}</h1>

    <div class="space-y-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <button 
          type="button" 
          @click="count++" 
          class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          count is {{ count }}
        </button>
        <p class="mt-2 text-gray-600">
          Edit
          <code class="bg-gray-200 px-2 py-1 rounded text-sm">components/HelloWorld.vue</code> to test HMR
        </p>
      </div>

      <div class="space-y-2">
        <p class="text-gray-700">
          Check out
          <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank" class="text-blue-500 hover:text-blue-600 underline"
            >create-vue</a
          >, the official Vue + Vite starter
        </p>
        <p class="text-gray-700">
          Learn more about IDE Support for Vue in the
          <a
            href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
            target="_blank"
            class="text-blue-500 hover:text-blue-600 underline"
            >Vue Docs Scaling up Guide</a
          >.
        </p>
        <p class="text-gray-500 text-sm">Click on the Vite and Vue logos to learn more</p>
      </div>
    </div>
  </div>
</template>



