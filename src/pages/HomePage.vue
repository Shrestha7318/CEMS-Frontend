<template>
  <!-- HERO Section -->
  <div
    id="hero"
    class="relative overflow-hidden min-h-[88vh] flex items-center
           w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
    <img
      src="https://images.unsplash.com/photo-1501862700950-18382cd41497?q=80&w=2400&auto=format&fit=crop"
      alt="Coastal waters"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-emerald-900/30"></div>
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

  <!-- CONTENT BELOW HERO -->
  <div class="container mx-auto px-6 lg:px-12 space-y-20 pb-28">

    <!-- ABSTRACT / INTRO -->
    <section class="space-y-4 pt-12">
      <h2 class="text-2xl md:text-3xl font-semibold">Abstract of Project</h2>
      <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
        The Coastal Bend Region (CBR) of Texas faces multiple environmental stressors — flooding,
        erosion, storm surge, and industrial expansion. Despite these risks, monitoring systems are
        fragmented and incomplete. <span class="font-semibold">CEMS advances how smart and connected
        technologies support community decision-making, hazard response, and climate adaptation.</span>
      </p>
      <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
        This project integrates residents, community organizations, and local governments to build
        cross-sector partnerships, enhance engagement with science and technology, and broaden
        participation among frontline communities.
      </p>
    </section>

    <!-- OBJECTIVES -->
    <section>
      <h2 class="text-2xl md:text-3xl font-semibold mb-6">Key Objectives</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <HowStep num="1" text="Evaluate how regional communication and policy networks evolve around climate and industrial change." />
        <HowStep num="2" text="Develop and deploy real-time sensing, machine learning models, and data dissemination tools." />
        <HowStep num="3" text="Integrate social + technical components via usability testing, workshops, and longitudinal studies." />
      </div>
    </section>

    <!-- LIVE MAP DEMO -->
    <section>
      <div class="flex items-end justify-between mb-4">
        <h2 class="text-2xl font-semibold">Live Map</h2>
        <RouterLink to="/devices" class="text-sm underline-offset-4 hover:underline">Browse devices</RouterLink>
      </div>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
        <DevicesMap :devices="devices" :center="center" :zoom="zoom" />
      </div>
    </section>

    <!-- FEATURE HIGHLIGHTS -->
    <section>
      <h2 class="text-2xl md:text-3xl font-semibold mb-6">Why CEMS?</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <FeatureCard icon="🌊" title="Coastal-Ready" desc="Hybrid connectivity and ruggedized casings maintain data flow despite harsh climate." />
        <FeatureCard icon="🔋" title="Low Power" desc="LoRaWAN reduces power draw and supports affordable long-term deployments." />
        <FeatureCard icon="🤝" title="Community First" desc="Workshops, symposia, and participatory sensing ensure inclusive decision-making." />
      </div>
    </section>

    <!-- METRICS -->
    <section>
      <h2 class="text-2xl md:text-3xl font-semibold mb-6">What We Measure</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Air Quality" :items="['PM2.5', 'PM10', 'NO₂', 'SO₂', 'O₃', 'CO₂', 'VOC']" />
        <MetricCard label="Seawater" :items="['Dissolved Oxygen', 'Salinity', 'Sea Level', 'pH', 'Temp']" />
        <MetricCard label="System Health" :items="['RSSI', 'Battery', 'Uptime']" />
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
import MetricCard from '@/components/MetricCard.vue'

const devices = ref([])
const center = ref([27.8767, -97.3231])
const zoom = ref(10)

onMounted(async () => {
  // fetch devices (mock or API)
})
</script>

<script>
export default {
  components: {
    FeatureCard: {
      props: { icon: String, title: String, desc: String },
      template: `
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition">
          <div class="flex items-center gap-2">
            <div class="text-xl">{{ icon }}</div>
            <h3 class="font-medium">{{ title }}</h3>
          </div>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ desc }}</p>
        </div>
      `
    },
    HowStep: {
      props: { num: String, text: String },
      template: `
        <div class="how-step">
          <div class="font-bold text-emerald-600 mb-1">Objective {{ num }}</div>
          <p class="text-sm text-slate-600 dark:text-slate-300">{{ text }}</p>
        </div>
      `
    }
  }
}
</script>
