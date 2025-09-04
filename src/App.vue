<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const isDark = ref(false)

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

  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 pt-8 px-6 lg:px-12">

    <Navbar :dark="isDark" @toggleDark="toggleDark" />
    <main class="container py-6">
      <RouterView />
    </main>
  </div>
  <footer class="mt-20 bg-transparent text-gray-600 dark:text-gray-300">
    
    <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center">
      <div class="text-lg font-semibold">🌍 CEMS Project</div>
      <div class="flex space-x-6 mt-4 md:mt-0">
        <a href="#" class="hover:text-blue-600 transition">About</a>
        <!-- <a href="#" class="hover:text-blue-600 transition">Privacy</a> -->
        <a href="#" class="hover:text-blue-600 transition">Contact</a>
      </div>
    </div>
    <div class="text-center py-4 text-sm border-t border-gray-300 dark:border-gray-700 pb-20">
       © 2025 CEMS.<!-- All rights reserved. -->
    </div>
  </footer>
</template>
