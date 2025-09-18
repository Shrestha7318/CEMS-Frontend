<template>
  <div class="container mx-auto px-6 lg:px-12 py-12 space-y-10">

    <!-- Page header -->
    <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-semibold mt-1">Project Team</h1>

      </div>


    </header>

    <!-- Team groups -->
    <section class="grid lg:grid-cols-3 gap-8">
      <article
        v-for="group in filteredGroups"
        :key="group.title"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6"
      >
        <h2 class="text-xl font-semibold mb-4">{{ group.title }}</h2>

        <ul class="space-y-3">
          <li v-for="person in group.people" :key="person.name" class="flex items-start gap-3">
            <!-- avatar -->
            <div
              class="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300
                     grid place-items-center text-sm font-semibold"
              aria-hidden="true"
            >
              {{ initials(person.name) }}
            </div>

            <div>
              <div class="font-medium leading-5">{{ person.name }}</div>
              <div v-if="person.note" class="text-xs text-slate-600 dark:text-slate-400 leading-5">
                {{ person.note }}
              </div>
              <a
                v-if="person.email"
                :href="`mailto:${person.email}`"
                class="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {{ person.email }}
              </a>
            </div>
          </li>
        </ul>
      </article>
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
      { name: 'Byeongseong Choi'}
    ]
  },
  {
    title: 'Computer Science Team - UTA',
    people: [
      { name: 'Chenxi Wang' },
      { name: 'Rojan Shrestha' },
      { name: 'Yonghe Liu' },
      { name: 'Jian Li' }
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
