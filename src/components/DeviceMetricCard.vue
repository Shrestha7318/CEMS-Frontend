<template>
  <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-soft">
    <!-- Header -->
    <div class="px-4 pt-4 pb-2">
      <div class="flex items-baseline justify-between">
        <h3 class="font-semibold">Recent Readings <span class="text-gray-500 dark:text-gray-400">(past 24 hours)</span></h3>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="busy" class="h-[420px] grid place-items-center text-sm text-gray-500 dark:text-gray-400">
      Loading…
    </div>

    <!-- Rows -->
    <div v-else class="divide-y divide-gray-200/70 dark:divide-gray-800/70">
      <div
        v-for="r in rows"
        :key="r.key"
        class="relative grid grid-cols-[120px,72px,1fr,84px] items-center gap-2 px-3"
        :class="isExpanded(r.key) ? 'py-4' : 'py-2.5'"
        @click="toggle(r.key)"
      >
        <!-- name -->
        <div class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ r.label }}</div>

        <!-- current -->
        <div class="text-sm tabular-nums">
          <span class="font-semibold">{{ fmt(currentOf(r.points)) }}</span>
          <span class="text-xs text-gray-500 ml-0.5">{{ r.unit }}</span>
        </div>

        <!-- chart cell -->
        <div class="w-full relative">
          <!-- Collapsed: mini bars -->
          <VChart
            v-if="!isExpanded(r.key)"
            :option="barOption(r)"
            autoresize
            style="height: 40px"
            class="pointer-events-none"
          />
          <!-- Expanded: CompareChart-like line (no slider) -->
          <div v-else class="relative">
            <VChart
              :option="lineOption(r)"
              autoresize
              style="height: 200px"
              class="pointer-events-none"
            />
            <!-- little minus button -->
            <!-- <button
              class="absolute top-1 right-1 inline-flex items-center justify-center h-6 w-6 rounded-md border text-xs
                     bg-white/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              @click.stop="toggle(r.key)"
              aria-label="Collapse row"
              title="Collapse"
            >–</button> -->
          </div>

          <!-- ↗ expand-to-modal button (always visible) -->
          <button
            class="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 rounded-md border text-xs
                   bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            @click.stop="openPopup(r.key)"
            aria-label="Open full compare"
            title="Open full compare"
          >↗</button>
        </div>

        <!-- min / max -->
        <div class="text-xs text-right text-gray-600 dark:text-gray-300 tabular-nums">
          <div>min <b class="ml-1">{{ fmt(minOf(r.points)) }}</b></div>
          <div>max <b class="ml-1">{{ fmt(maxOf(r.points)) }}</b></div>
        </div>
      </div>

      <div v-if="rows.length === 0" class="h-[420px] grid place-items-center text-sm text-gray-500 dark:text-gray-400">
        No data in the past 24 hours.
      </div>
    </div>

    <!-- POPUP: full CompareChart with controls -->
    <dialog ref="dlg" class="backdrop:bg-black/40 p-0 rounded-2xl overflow-hidden w-[min(980px,96vw)]">
      <div class="bg-white dark:bg-gray-900">
        <!-- header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h4 class="font-semibold">Comparision Chart</h4>
          <button
            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border text-sm
                   bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="closePopup"
            aria-label="Close"
            title="Close"
          >✕</button>
        </div>

        <!-- body -->
        <div class="p-4 space-y-3">
          <CompareChart
            :seriesByDevice="popupSeriesByDevice"
            :metric="popupMetric"
            :days="popupDays"
          >
            <template #controls>
              <div class="flex items-center gap-2">
                <!-- Metric selector -->
                <select v-model="popupMetric" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
                  <option v-for="m in metricOptions" :key="m" :value="m">{{ LABELS[m] || m }}</option>
                </select>

                <!-- Range selector -->
                <select v-model="popupRange" class="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm">
                  <option value="6h">6h</option>
                  <option value="12h">12h</option>
                  <option value="24h">24h</option>
                  <option value="3d">3d</option>
                  <option value="7d">7d</option>
                </select>

                <button
                  class="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                  @click="reloadPopup"
                >
                  Refresh
                </button>
              </div>
            </template>
          </CompareChart>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import CompareChart from '@/components/CompareChart.vue'
import { api } from '@/services/api'
import { thSiteOf, vocSiteOf } from '@/constants/mapSites'
use([CanvasRenderer, BarChart, LineChart, TooltipComponent, GridComponent, LegendComponent])

const props = defineProps<{
  rows: Array<{ key: string ; label: string; unit: string; points: Array<{ts: number|string; value: number|string}> }>,
  busy?: boolean,
  expandedKeys?: string[],
  baseId: string // selected map device id (e.g., 'UTIS0001')
}>()
const emit = defineEmits(['toggle'])

/** -------- collapsed/expanded row state (in-row) ---------- */
const isExpanded = (k: string) => (props.expandedKeys || []).includes(k)
const toggle = (k: string) => emit('toggle', k)

/** ----------------- helpers shared ----------------- */
function toMs(ts: any) {
  if (typeof ts === 'number') return ts < 1e12 ? ts * 1000 : ts
  const ms = Date.parse(ts as any)
  return Number.isFinite(ms) ? ms : NaN
}
function fmt(v: any) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const n = Number(v)
  return Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : '—'
}
const currentOf = (pts: any[] = []) => {
  for (let i = pts.length - 1; i >= 0; i--) {
    const v = Number(pts[i]?.value); if (Number.isFinite(v)) return v
  }
  return null
}
const minOf = (pts: any[] = []) => {
  const arr = pts.map(p => Number(p.value)).filter(Number.isFinite)
  return arr.length ? Math.min(...arr) : null
}
const maxOf = (pts: any[] = []) => {
  const arr = pts.map(p => Number(p.value)).filter(Number.isFinite)
  return arr.length ? Math.max(...arr) : null
}
const dataPairs = (row: any) =>
  (row.points || [])
    .map((d: any) => [toMs(d.ts), Number(d.value)])
    .filter(([x,y]) => Number.isFinite(x as number) && Number.isFinite(y as number))
    .sort((a:any,b:any) => (a[0] as number)-(b[0] as number))

/** ----------------- collapsed bar option ----------------- */
function barOption(row: any) {
  const data = dataPairs(row).map(([x,y]: any) => [x,y])
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: any) => `${fmt(v)} ${row.unit || ''}`.trim() },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'time', axisLabel: { show:false }, axisTick:{ show:false }, axisLine:{ show:false }, splitLine:{ show:false } },
    yAxis: { type: 'value', scale:true, axisLabel:{ show:false }, axisTick:{ show:false }, axisLine:{ show:false }, splitLine:{ show:false } },
    series: [{ type: 'bar', barWidth: '90%', showBackground: true, backgroundStyle: { opacity: 0.05 }, data, large: true }]
  }
}

/** ----------------- expanded line option ----------------- */
function lineOption(row: any) {
  const data = dataPairs(row)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { show: false },
    grid: { left: 10, right: 10, top: 20, bottom: 28, containLabel: true },
    xAxis: {
      type: 'time',
      splitNumber: 6,
      axisLabel: {
        hideOverlap: true,
        formatter: (v: number) => new Intl.DateTimeFormat(undefined, {
          month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
        }).format(new Date(v))
      }
    },
    yAxis: { type: 'value', scale: true, name: row.unit || '', nameGap: 10 },
    series: [{ type: 'line', showSymbol: false, smooth: false, sampling: 'lttb', data }]
  }
}

/** ----------------- popup (full compare) ----------------- */
const dlg = ref<HTMLDialogElement | null>(null)
const popupMetric = ref<string>('pm25')
const popupRange  = ref<string>('24h') // default
const popupSeriesByDevice = ref<Record<string, any[]>>({})
const LABELS: Record<string,string> = {
  pm25:'PM2.5', pm10:'PM10', temperature:'Temperature', humidity:'Humidity',
  noise:'Noise', illumination:'Illumination', voc:'VOC', o3:'O₃', so2:'SO₂', no2:'NO₂'
}
const metricOptions = computed(() => props.rows?.map(r => r.key) || [])
const popupDays = computed(() => Math.max(1, Math.round(hoursFrom(popupRange.value) / 24)))

function hoursFrom(range: string) {
  if (range.endsWith('h')) return parseInt(range)
  if (range.endsWith('d')) return parseInt(range) * 24
  return 24
}
function siteIdFor(metric: string) {
  // th vs voc routing
  const TH = new Set(['pm25','pm10','temperature','humidity','noise','illumination','pressure'])
  return TH.has(metric) ? thSiteOf(props.baseId) : vocSiteOf(props.baseId)
}
async function reloadPopup() {
  popupSeriesByDevice.value = {}
  const hours = hoursFrom(popupRange.value)
  const siteId = siteIdFor(popupMetric.value)
  const resp = await api.getTimeseriesByMetric({ metric: popupMetric.value, siteIds: [siteId], hours })
  popupSeriesByDevice.value = resp || {}
}
function openPopup(fromMetric: string) {
  popupMetric.value = fromMetric
  popupRange.value = '24h'
  reloadPopup()
  dlg.value?.showModal()
}
function closePopup() { dlg.value?.close() }
watch([popupMetric, popupRange], () => { if (dlg.value?.open) reloadPopup() })
</script>
