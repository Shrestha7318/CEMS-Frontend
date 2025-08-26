<template>
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
</script>
