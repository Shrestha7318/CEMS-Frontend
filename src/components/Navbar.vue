<!-- <template>
  <header
    class="bg-white/80 dark:bg-gray-900/80 sticky top-0 backdrop-blur border-b border-gray-200 dark:border-gray-800 z-40">
    <div class="container flex items-center justify-between h-14">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-xl bg-emerald-500"></div>
        <router-link to="/" class="font-semibold tracking-tight">EnvMonitor</router-link>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-sm">
        <RouterLink to="/" class="hover:underline underline-offset-4">Dashboard</RouterLink>
        <RouterLink to="/devices" class="hover:underline underline-offset-4">Devices</RouterLink>
        <a class="opacity-50 cursor-not-allowed">Alerts</a>
        <a class="opacity-50 cursor-not-allowed">Info</a>
        <a class="opacity-50 cursor-not-allowed">Admin</a>
      </nav>

      <div class="flex items-center gap-3">
        <button @click="$emit('toggleDark')"
          class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-soft hover:shadow-md transition"
          :title="dark ? 'Switch to light' : 'Switch to dark'">
          <span v-if="!dark">🌙</span>
          <span v-else>☀️</span>
        </button>
        <div class="md:hidden">
          <RouterLink to="/devices" class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800">Menu
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({ dark: Boolean })
defineEmits(['toggleDark'])
</script> -->
<template>
  <nav class="dark:bg-gray-900/80 sticky bg-white shadow-md fixed w-full top-0 left-0 z-50">
    <div class="max-w-7xl mx-auto px-6 lg:px-12">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="text-2xl font-bold text-blue-600 cursor-pointer">
          CEMS
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex space-x-8">
          <RouterLink to="/" class="text-gray-500 hover:text-blue-600 transition">Dashboard</RouterLink>
          <RouterLink to="/devices" class="text-gray-500 hover:text-blue-600 transition">Devices</RouterLink>
          <a href="#" class="text-gray-500 hover:text-blue-600 transition cursor-not-allowed">Reports</a>
          <!-- <a href="#" class="text-gray-500 hover:text-blue-600 transition cursor-not-allowed">Admin</a> -->
          <a href="#" class="text-gray-500 hover:text-blue-600 transition cursor-not-allowed">Alerts</a>
        </div>

        <button @click="$emit('toggleDark')"
          class="relative w-14 h-7 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300"
          :title="dark ? 'Switch to light' : 'Switch to dark'">

          <!-- Sun & Moon icons -->
          <span class="absolute left-1 text-yellow-400 text-sm">☀️</span>
          <span class="absolute right-1 text-gray-200 text-sm">🌙</span>

          <!-- Sliding circle -->
          <div
            class="w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300"
            :class="dark ? 'translate-x-7' : 'translate-x-0'">
          </div>
        </button>
        <!-- CTA Button -->
        <div class="hidden md:flex">
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition cursor-not-allowed">
            Login
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center">
          <button @click="isOpen = !isOpen">
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown -->
    <div v-if="isOpen" class="md:hidden bg-white shadow-md">
      <RouterLink to="/" class="block px-6 py-3 text-gray-700 hover:bg-gray-100">Dashboard</RouterLink>
      <RouterLink to="/devices" class="block px-6 py-3 text-gray-700 hover:bg-gray-100">Devices</RouterLink>
      <a href="#" class="block px-6 py-3 text-gray-700 hover:bg-gray-100 cursor-not-allowed">Reports</a>
      <a href="#" class="block px-6 py-3 text-gray-700 hover:bg-gray-100 cursor-not-allowed">Admin</a>
      <button class="w-full text-left px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 cursor-not-allowed">
        Login
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
const isOpen = ref(false)

defineProps({
  dark: Boolean
})
</script>
