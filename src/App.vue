<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const isDark = ref(false)
const route = useRoute()

const isHome = computed(() => route.path === '/' || route.name === 'home')

const applyTheme = () => {
  const root = document.documentElement // <html>
  if (isDark.value) root.classList.add('dark')
  else root.classList.remove('dark')
}

const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  applyTheme()
})
</script>

<template>
  <!-- Page shell -->
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <!-- Fixed navbar (can be transparent over Home hero if you applied that Navbar change) -->
    <Navbar :dark="isDark" @toggleDark="toggleDark" />

    <!-- Main area:-->
    <main :class="isHome ? '' : 'container mx-auto  w-[80%] pt-16 md:pt-[72px]'">
      <RouterView />
    </main>
  </div>

  <!-- Footer -->
  <footer class="mt-20 bg-transparent text-gray-600 dark:text-gray-300">
    <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center">
      <div class="text-lg font-semibold">🌍 Smart Coast Project</div>
      <div class="flex space-x-6 mt-4 md:mt-0">
        <a href="#" class="hover:text-blue-600 transition">About</a>

      </div>
    </div>
    <div class="text-center py-4 text-sm border-t border-gray-300 dark:border-gray-700 pb-20">
      © 2025 Smart Coast Project. <br>University of Texas at Arlington. 
    </div>
  </footer>
</template>
