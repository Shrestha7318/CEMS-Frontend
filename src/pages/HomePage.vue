<template>
  <!-- HERO (full-page height with darker overlay in dark mode) -->
  <div
    id="hero"
    class="relative overflow-hidden h-[100svh] md:min-h-[92svh] flex items-center
           w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <img
      src="https://images.unsplash.com/photo-1501862700950-18382cd41497?q=80&w=2400&auto=format&fit=crop"
      alt="Coastal waters"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-br
                from-slate-950/75 via-slate-900/55 to-emerald-900/25
                dark:from-slate-950/90 dark:via-slate-950/75 dark:to-emerald-950/40"></div>

    <div class="relative z-10 max-w-4xl px-6 md:px-10 text-left text-white pt-20">
      <p class="text-xs md:text-sm uppercase tracking-[0.22em] text-emerald-300">
        Coastal Environmental Monitoring
      </p>
      <h1 class="mt-3 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
        CEMS — real-time air & seawater monitoring for coastal communities
      </h1>
      <p class="mt-5 text-white/85 max-w-2xl">
        Low-cost sensing units stream data to a secure server so you can visualize trends,
        compare sites, and act quickly when thresholds are exceeded.
      </p>
      <div class="mt-7 flex flex-wrap items-center gap-4">
        <RouterLink to="/dashboard" class="btn-primary">Open dashboard</RouterLink>
        <RouterLink to="/devices" class="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/15">
          Explore devices
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- STATS STRIP (inline, no child components) -->
  <section class="container mx-auto px-6 lg:px-12 -mt-8 md:-mt-12">
    <div class="rounded-2xl backdrop-blur border border-white/20 dark:border-slate-800
                bg-white/60 dark:bg-slate-900/60 grid sm:grid-cols-3 gap-4 p-4 md:p-6">
      <!-- Stat 1 -->
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 20h2M7 20v-4h2M11 20v-8h2M15 20v-12h2M19 20v-16h2"/>
        </svg>
        <div>
          <div class="text-xl font-semibold">{{ stats.sensorsOnline }}</div>
          <div class="text-xs text-slate-600 dark:text-slate-400">Sensors Online</div>
        </div>
      </div>
      <!-- Stat 2 -->
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>
        </svg>
        <div>
          <div class="text-xl font-semibold">{{ stats.sites }}</div>
          <div class="text-xs text-slate-600 dark:text-slate-400">Sites</div>
        </div>
      </div>
      <!-- Stat 3 -->
      <div class="flex items-center gap-3">
 <svg class="w-6 h-6 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>

        <div>
          <div class="text-xl font-semibold">{{ stats.metrics }}</div>
          <div class="text-xs text-slate-600 dark:text-slate-400">Metrics</div>
        </div>
      </div>
    </div>
  </section>

  <!-- CONTENT -->
  <div class="container mx-auto px-6 lg:px-12 space-y-16 md:space-y-20 pb-28">

    <!-- INTRO (inline pills with icons) -->
    <section class="space-y-6 pt-16">
      <div class="mb-2">
        <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">Why this matters</p>
        <h2 class="text-2xl md:text-3xl font-semibold mt-1">Adaptive monitoring for coastal communities</h2>
      </div>

      <p class="text-slate-700 dark:text-slate-300 max-w-3xl">
        The Coastal Bend Region faces flooding, erosion, and industrial expansion—yet monitoring is fragmented.
        CEMS integrates low-cost sensors, resilient communications, and a community-first workflow to improve local decisions.
      </p>

      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full
                     border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <!-- shield-check -->
          <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c6-2 8-5.5 8-10V7l-8-4-8 4v5c0 4.5 2 8 8 10"/><path d="M9 12l2 2 4-4"/>
          </svg> Resilience-focused
        </span>

        <span class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full
                     border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <!-- cpu -->
          <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>
          </svg> Low-cost sensing + ML
        </span>

        <span class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full
                     border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <!-- radio -->
          <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2"/><path d="M5 12a7 7 0 0 1 14 0"/><path d="M2 12a10 10 0 0 1 20 0"/>
          </svg> LoRaWAN / RS-485 / Wi-Fi
        </span>

        <span class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full
                     border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <!-- users -->
          <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg> Co-developed with communities
        </span>
      </div>
    </section>

    <!-- OBJECTIVES (3 numbered cards inline) -->
    <section>
      <div class="mb-2">
        <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">Project objectives</p>
        <h2 class="text-2xl md:text-3xl font-semibold mt-1">What we’re building</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Card -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="text-sm font-semibold text-emerald-600">01</div>
          <h3 class="mt-1 font-medium">Map regional networks</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Track how communication & policy networks evolve around climate and industrial change.
          </p>
        </div>
        <!-- Card -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="text-sm font-semibold text-emerald-600">02</div>
          <h3 class="mt-1 font-medium">Real-time sensing & models</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Deploy sensors + ML to monitor, predict, and communicate conditions.
          </p>
        </div>
        <!-- Card -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="text-sm font-semibold text-emerald-600">03</div>
          <h3 class="mt-1 font-medium">Human-centered integration</h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Usability tests, workshops, and longitudinal studies to make data actionable.
          </p>
        </div>
      </div>
    </section>

    <!-- LIVE MAP (tablet-like frame; uses your DevicesMap) -->
    <section>
      <div class="flex items-end justify-between mb-4">
        <div class="mb-2">
          <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">Try it</p>
          <h2 class="text-2xl md:text-3xl font-semibold mt-1">Live Map</h2>
        </div>
        <RouterLink to="/devices" class="text-sm underline-offset-4 hover:underline">Browse devices</RouterLink>
      </div>
    <p class ="text-sm text-gray-500 dark:text-gray-400 mb-3">Pan and zoom the map to explore device locations. Click a marker for more details.</p>
      <div class="rounded-[28px] border border-slate-200 dark:border-slate-800
                  bg-white/70 dark:bg-slate-900/60 backdrop-blur p-3">
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          <div class="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full bg-slate-300/70 dark:bg-slate-700/70"></div>
          <DevicesMap :devices="devices" :center="center" :zoom="zoom" class="h-[420px] w-full" />
        </div>
      </div>
    </section>

    <!-- WHY CEMS (3 feature tiles inline) -->
    <section>
      <div class="mb-2">
        <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">Why CEMS</p>
        <h2 class="text-2xl md:text-3xl font-semibold mt-1">Built for coastlines, cost-effective at scale</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Feature -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="flex items-center gap-2">
            <!-- globe -->
            <svg class="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>
            </svg>
            <h3 class="font-medium">Hybrid connectivity</h3>
          </div>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            LoRaWAN uplinks with RS-485 sensor buses and Wi-Fi/4G bridges for tricky coastlines.
          </p>
        </div>

        <!-- Feature -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="flex items-center gap-2">
            <!-- bolt -->
            <svg class="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/>
            </svg>
            <h3 class="font-medium">Low power, long life</h3>
          </div>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sleep/wake policies and low-draw radios extend deployments with minimal maintenance.
          </p>
        </div>

        <!-- Feature -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="flex items-center gap-2">
            <!-- server -->
            <svg class="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>
            </svg>
            <h3 class="font-medium">Open, inspectable backend</h3>
          </div>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            ChirpStack + PostgreSQL + Nginx; decode payloads once and reuse everywhere.
          </p>
        </div>
      </div>
    </section>

    <!-- WHAT WE MEASURE -->
<section>
  <div class="mb-2">
    <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400/90">Signals</p>
    <h2 class="text-2xl md:text-3xl font-semibold mt-1">What We Measure</h2>
  </div>

  <div class="grid sm:grid-cols-2 gap-6">
    <!-- Air Quality -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
      <div class="flex items-center gap-2 mb-3">
        <!-- <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/>
        </svg> -->
        <h3 class="font-medium">Air Quality</h3>
      </div>
      <ul class="text-sm text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
        <li v-for="it in ['PM2.5','PM10','VOC','O₃','SO₂','NO₂']" :key="it" class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{ it }}
        </li>
      </ul>
    </div>

    <!-- Environmental Conditions -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
      <div class="flex items-center gap-2 mb-3">
        <!-- <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M12 2v20M2 12h20"/>
        </svg> -->
        <h3 class="font-medium">Environmental</h3>
      </div>
      <ul class="text-sm text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
        <li v-for="it in ['Temperature','Humidity','Noise','Illumination']" :key="it" class="flex items-center gap-2">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500"></span>{{ it }}
        </li>
      </ul>
    </div>
  </div>
</section>

    <!-- CTA -->
    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8
                    bg-gradient-to-br from-emerald-50/60 to-cyan-50/60 dark:from-slate-900/60 dark:to-slate-900/60 backdrop-blur">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold">Ready to explore live data?</h3>
          <p class="text-sm text-slate-600 dark:text-slate-300">Jump into the dashboard or browse all devices.</p>
        </div>
        <div class="flex gap-3">
          <RouterLink to="/dashboard" class="btn-primary">Open Dashboard</RouterLink>
          <RouterLink to="/devices" class="btn-ghost">View Devices</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DevicesMap from '@/components/DevicesMap.vue'  


const devices = ref([])
const center = ref([27.8767, -97.3231])
const zoom = ref(10)

const stats = ref({
  sensorsOnline: '—',
  sites: '—',
  metrics: '—'
})

onMounted(async () => {
  stats.value = { sensorsOnline: '10', sites: '10', metrics: '10' }
})
</script>
