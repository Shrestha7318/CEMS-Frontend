<template>
  <div class="container mx-auto px-6 lg:px-12 py-12 space-y-10">

    <!-- About the Project -->
    <section class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-6">
      <h1 class="text-3xl md:text-4xl font-semibold mb-4">About the Project</h1>
      <div class="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
        <p>
          The Coastal Bend Region (CBR) of Texas is vulnerable to acute and chronic environmental stressors stemming
          from natural and industrial sources, including flooding and erosion from high tides, storm surge events, and
          ship traffic, as well as higher levels of air and water pollution due to expansion of nearby industrial
          operations.
        </p>

        <p>
          Despite the multitude of environmental hazards facing the region, formal monitoring systems are limited and
          provide an incomplete view of local-level conditions. In addition, networks for communication and
          decision-making are often localized and/or fragmented. As a result, CBR communities lack the comprehensive
          data and decision-making structures needed to plan for, respond to, and mitigate the impacts of potential
          hazards.


        </p>

        <p>
          This project will advance the understanding of how smart and connected technologies can be integrated into and
          support regional communication networks to build adaptive capacity in the face of cumulative impacts from
          climate change and industrial expansion, using the CBR as an exemplar. Research activities will be
          co-developed and coordinated with residents, community-based organizations, elected officials, and city/county
          staff to strengthen multidisciplinary, cross-sector partnerships, enhance public engagement with science and
          technology, and broaden participation by underrepresented groups and frontline communities in the scientific
          process.
        </p>
        <div>
          <h3 class="font-medium mb-2">Objectives</h3>
          <ul class="list-disc pl-5 space-y-1">
            <li>Evaluate how regional communication, information-sharing, and policy-making networks evolve around
              environmental change and industrial expansion.</li>
            <li>Develop real-time sensing, machine-learning models, and data tools to monitor, predict, and communicate
              local environmental conditions.</li>
            <li>Integrate social and technical components via usability testing, tabletop exercises, and longitudinal
              surveys to ensure data are interpretable and actionable for diverse stakeholders.</li>
          </ul>
        </div>
        <p>Community workshops and symposia will provide opportunities to refine the study needs and objectives, obtain
          feedback on the sensor network and data products, share project results, co-develop a vision for long-term
          sustainability of the project, and discuss opportunities for integration with other regional efforts.</p>

        <p>This project is in response to the Smart & Connected Communities program. It is co-funded by the Advancing
          Informal STEM Learning program which seeks to advance new approaches to, and evidence-based understanding of,
          the design and development of STEM learning in informal environments.</p>
        <p class="text-sm">
          For more information:
          <a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2231557" target="_blank" rel="noopener"
            class="text-emerald-700 dark:text-emerald-400 hover:underline">
            NSF Award #2231557
          </a>
        </p>
      </div>
    </section>

    <!-- Project Team -->
    <section>
      <header class="mb-6">
        <h1 class="text-3xl md:text-4xl font-semibold">Project Team</h1>
      </header>

      <div class="grid lg:grid-cols-3 gap-8">
        <article v-for="group in filteredGroups" :key="group.title"
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
          <h2 class="text-xl font-semibold mb-4">{{ group.title }}</h2>
          <ul class="space-y-3">
            <li v-for="person in group.people" :key="person.name" class="flex items-start gap-3">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300
                       grid place-items-center text-sm font-semibold" aria-hidden="true">
                {{ initials(person.name) }}
              </div>
              <div>
                <div class="font-medium leading-5">{{ person.name }}</div>
                <div v-if="person.note" class="text-xs text-slate-600 dark:text-slate-400 leading-5">
                  {{ person.note }}
                </div>
                <a v-if="person.email" :href="`mailto:${person.email}`"
                  class="text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
                  {{ person.email }}
                </a>
              </div>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- Former members -->
    <section class="mt-4">
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
        <h2 class="text-xl font-semibold mb-3">Former Members & Contributors</h2>
        <ul class="grid sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-slate-700 dark:text-slate-300">
          <li v-for="p in formerMembers" :key="p">{{ p }}</li>
        </ul>
      </div>
    </section>

  </div>
</template>


<script setup>
import { computed, ref } from 'vue'

const groups = ref([
  {
    title: 'Coastal Watch Association',
    people: [
      { name: 'Patrick A. Nye' },
      { name: 'Payton Campbell' },
      { name: 'Encarnacion Serna' }
    ]
  },
  {
    title: 'Engineering Team - UTA',
    people: [
      { name: 'Michelle Hummel' },
      { name: 'Byeongseong Choi' }
    ]
  },
  {
    title: 'Computer Science Team - UTA',
    people: [
      { name: 'Yonghe Liu' },
      { name: 'Chenxi Wang' },
      { name: 'Jian Li' },
      { name: 'Rojan Shrestha' }
    ]
  },
  {
    title: 'Communication & Design - UTA',
    people: [
      { name: 'Oswald Jenewein' }
    ]
  }
])

const formerMembers = ref([
  'Kathryn Masten',
  'Cyndi Valdes',
  'Jennifer Hilliard',
  'Justin C. Kim',
  'Alice Tran',
  'Trent Fantini'
])

const filter = ref('')

const filteredGroups = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value
    .map(g => ({
      ...g,
      people: g.people.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.note && p.note.toLowerCase().includes(q)) ||
        g.title.toLowerCase().includes(q)
      )
    }))
    .filter(g => g.people.length > 0 || g.title.toLowerCase().includes(q))
})

const initials = (full) => {
  return full
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
}
</script>
