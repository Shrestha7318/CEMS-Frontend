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
  <!-- remove the outer :class="{ dark: isDark }" wrapper -->
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <Navbar :dark="isDark" @toggleDark="toggleDark" />
    <main class="container py-6">
      <RouterView />
    </main>
  </div>
</template>
