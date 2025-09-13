<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

const isOpen = ref(false)
const scrolled = ref(true) // default solid
defineProps({ dark: Boolean })

const route = useRoute()
let io = null
let onScrollHandler = null

const isHomeRoute = () => route.path === '/' || route.name === 'home'

function detachObservers() {
  if (io) { io.disconnect(); io = null }
  if (onScrollHandler) { window.removeEventListener('scroll', onScrollHandler); onScrollHandler = null }
}

function setupNavbarBehavior() {
  detachObservers()

  if (isHomeRoute()) {
    // Start transparent over hero
    scrolled.value = false

    const sentinel = document.getElementById('nav-sentinel')
    if (sentinel && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[0]
          // When sentinel is visible => still within hero => transparent
          // When it leaves => hero ended => solid
          scrolled.value = !e.isIntersecting
        },
        {
          root: null,
          rootMargin: '-64px 0px 0px 0px', // adjust to your navbar height
          threshold: 0
        }
      )
      io.observe(sentinel)
    } else {
      // Fallback: simple threshold near one viewport height
      onScrollHandler = () => { scrolled.value = window.scrollY > window.innerHeight * 0.8 }
      window.addEventListener('scroll', onScrollHandler, { passive: true })
    }
  } else {
    // Non-home: always solid
    scrolled.value = true
  }
}

onMounted(setupNavbarBehavior)
watch(() => route.fullPath, setupNavbarBehavior)
onBeforeUnmount(detachObservers)
</script>

<template>
  <nav
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
    :class="scrolled
      ? 'bg-white/85 dark:bg-gray-900/70 backdrop-blur shadow-sm'
      : 'bg-transparent'"
  >
    <div class="mx-auto max-w-7xl px-6 lg:px-12">
      <div class="flex h-16 items-center justify-between">
        <RouterLink
          to="/"
          class="text-2xl font-bold transition"
          :class="scrolled ? 'text-blue-600' : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]'"
        >
          CEMS
        </RouterLink>

        <!-- Desktop Menu -->
        <div class="hidden md:flex space-x-8">
          <RouterLink :class="scrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/85 hover:text-white'" to="/dashboard">Dashboard</RouterLink>
          <RouterLink :class="scrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/85 hover:text-white'" to="/devices">Devices</RouterLink>
          <span :class="scrolled ? 'text-gray-400' : 'text-white/60'">Reports</span>
          <span :class="scrolled ? 'text-gray-400' : 'text-white/60'">Alerts</span>
        </div>

        <!-- Theme toggle -->
        <button
          @click="$emit('toggleDark')"
          class="relative w-14 h-7 flex items-center rounded-full p-1 transition"
          :class="scrolled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-white/25 backdrop-blur'"
          :title="$props.dark ? 'Switch to light' : 'Switch to dark'"
        >
          <span class="absolute left-1 text-yellow-300 text-sm">☀️</span>
          <span class="absolute right-1 text-gray-200 text-sm">🌙</span>
          <div
            class="w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300"
            :class="$props.dark ? 'translate-x-7' : 'translate-x-0'"
          />
        </button>

        <!-- Desktop CTA -->
        <div class="hidden md:flex">
          <button
            class="px-4 py-2 rounded-xl transition"
            :class="scrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur'"
          >
            Login
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center">
          <button @click="isOpen = !isOpen">
            <svg class="w-6 h-6" :class="scrolled ? 'text-gray-700' : 'text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown -->
    <div v-if="isOpen" class="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-md">
      <RouterLink to="/dashboard" class="block px-6 py-3 text-gray-800 dark:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/60">Dashboard</RouterLink>
      <RouterLink to="/devices" class="block px-6 py-3 text-gray-800 dark:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/60">Devices</RouterLink>
      <span class="block px-6 py-3 text-gray-400 cursor-not-allowed">Reports</span>
      <span class="block px-6 py-3 text-gray-400 cursor-not-allowed">Alerts</span>
      <button class="w-full text-left px-6 py-3 bg-blue-600 text-white hover:bg-blue-700">Login</button>
    </div>
  </nav>
</template>
