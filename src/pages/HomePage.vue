<template>
  <!-- HERO (full-bleed + dark overlay) -->
  <div
  id="hero"
  class="relative overflow-hidden min-h-[88vh] flex items-center
         w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <!-- background image -->
    <img
      src="https://images.unsplash.com/photo-1501862700950-18382cd41497?q=80&w=2400&auto=format&fit=crop"
      alt="Coastal waters"
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- darkening gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-emerald-900/30"></div>

    <!-- floating blobs -->
    <div class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl"></div>
    <div class="pointer-events-none absolute -left-24 bottom-24 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"></div>

    <!-- content (pt-20 clears fixed navbar) -->
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
      <div id="nav-sentinel" class="absolute bottom-0 left-0 right-0 h-px"></div>

      <!-- badges -->
      <div class="mt-8 flex flex-wrap items-center gap-6 text-xs text-white/80">
        <span class="inline-flex items-center gap-2"><span class="badge-dot bg-emerald-400"></span> LoRaWAN + RS-485</span>
        <span class="inline-flex items-center gap-2"><span class="badge-dot bg-cyan-400"></span> Open API</span>
        <span class="inline-flex items-center gap-2"><span class="badge-dot bg-amber-400"></span> Threshold alerts</span>
      </div>
    </div>
  </div>

  <!-- CONTENT BELOW HERO (boxed) -->
  <div class="container mx-auto px-6 lg:px-12 space-y-16 pb-28">

    <!-- LIVE MAP -->
    <section class="space-y-3 pt-10">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-xl font-semibold">Live map</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Pan and zoom to explore monitoring sites. Click a marker for quick stats and deep links.
          </p>
        </div>
        <RouterLink to="/devices" class="text-sm underline-offset-4 hover:underline">Browse all devices</RouterLink>
      </div>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
        <DevicesMap :devices="devices" :center="center" :zoom="zoom" />
      </div>
    </section>

    <!-- VALUE PROPS (animated on scroll) -->
    <section class="grid md:grid-cols-3 gap-4">
      <FeatureCard
        icon="🌊"
        title="Built for the coast"
        desc="Hybrid connectivity and ruggedized units maintain data flow despite humidity, wind, and distance between sites."
      />
      <FeatureCard
        icon="🔋"
        title="Low-power, low-cost"
        desc="LoRaWAN reduces power draw and infrastructure needs, keeping deployments affordable and scalable."
      />
      <FeatureCard
        icon="🔗"
        title="Open & extensible"
        desc="Standards-based RS-485 sensors and an API-ready server let you integrate new metrics and tools easily."
      />
    </section>

    <!-- WHAT WE MEASURE -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xl font-semibold">What we measure</h2>
        <RouterLink to="/dashboard" class="text-sm underline-offset-4 hover:underline">See live charts</RouterLink>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Air Quality" :items="['AQI', 'PM2.5', 'PM10', 'NO₂', 'SO₂', 'O₃', 'CO₂', 'Temp', 'Humidity']" />
        <MetricCard label="Seawater" :items="['Dissolved Oxygen', 'Salinity', 'Sea Level', 'Water Temp', 'pH']" />
        <MetricCard label="System Health" :items="['RSSI', 'Uptime', 'Battery / Power']" />
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section>
      <h2 class="text-xl font-semibold mb-3">How it works</h2>
      <ol class="grid md:grid-cols-3 gap-4 text-sm">
        <li class="how-step"><b>CEMU sensors</b> capture air & seawater data via RS-485 and analog inputs inside an IP-rated enclosure.</li>
        <li class="how-step"><b>LoRaWAN uplink</b> sends readings to a gateway; ChirpStack decodes payloads and stores them in PostgreSQL.</li>
        <li class="how-step"><b>Portal & API</b> render maps, charts, and comparisons—plus CSV/PNG exports for reports.</li>
      </ol>
    </section>

    <!-- PHOTO STRIP -->
    <section class="reveal">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PhotoTile src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop" />
        <PhotoTile src="https://images.unsplash.com/photo-1526483360412-f4dbaf036963?q=80&w=1200&auto=format&fit=crop" />
        <PhotoTile src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop" />
        <PhotoTile src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop" />
      </div>
    </section>

    <!-- CTA -->
    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 bg-gradient-to-br from-emerald-50/60 to-cyan-50/60 dark:from-slate-900/60 dark:to-slate-900/60 backdrop-blur">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold">Ready to explore live data?</h3>
          <p class="text-sm text-slate-600 dark:text-slate-300">Jump into the dashboard or browse all devices.</p>
        </div>
        <div class="flex gap-3">
          <RouterLink to="/dashboard" class="btn-primary">Open dashboard</RouterLink>
          <RouterLink to="/devices" class="btn-ghost">View devices</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DevicesMap from '@/components/DevicesMap.vue'
import MetricCard from '@/components/MetricCard.vue'
import { api } from '@/services/api'

const devices = ref([])
const center = ref([27.8767, -97.3231])
const zoom = ref(10)

onMounted(async () => {
  try {
    devices.value = await api.getSensors('')
    const first = devices.value.find(d => Number.isFinite(d.lat) && Number.isFinite(d.lon))
    if (first) center.value = [first.lat, first.lon]
    initReveal()
  } catch (e) {
    console.warn('Failed to load devices', e)
  }
})

function initReveal() {
  const els = document.querySelectorAll('.reveal, .how-step, .feature-card')
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
  }, { threshold: 0.12 })
  els.forEach(el => io.observe(el))
}
</script>

<script>
export default {
  components: {
    FeatureCard: {
      props: { icon: String, title: String, desc: String },
      template: `
        <div class="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 feature-card hover:-translate-y-0.5 transition transform duration-300">
          <div class="flex items-center gap-2">
            <div class="text-xl">{{ icon }}</div>
            <h3 class="font-medium">{{ title }}</h3>
          </div>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ desc }}</p>
          <div class="mt-4 h-1 rounded-full bg-gradient-to-r from-emerald-400/60 via-cyan-400/60 to-transparent group-hover:from-emerald-400 group-hover:via-cyan-400"/>
        </div>
      `
    },
    PhotoTile: {
      props: { src: String },
      template: `
        <div class="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 feature-card">
          <img :src="src" alt="coastal" class="w-full h-40 md:h-48 object-cover hover:scale-105 transition-transform duration-700"/>
        </div>
      `
    }
  }
}
</script>

<style scoped>
/* buttons */
.btn-primary { @apply inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition; }
.btn-ghost   { @apply inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition; }
.badge-dot   { @apply inline-block h-2.5 w-2.5 rounded-full; }

/* reveal animation */
.reveal, .how-step, .feature-card {
  opacity: 0; transform: translateY(8px) scale(.995);
  transition: opacity .6s ease, transform .6s ease;
}
.reveal.in, .how-step.in, .feature-card.in { opacity: 1; transform: translateY(0) scale(1); }

/* list cards */
.how-step { @apply p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur; }
</style>
