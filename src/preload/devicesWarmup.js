// src/preload/devicesWarmup.js
import { api } from '@/services/api'
import { idbSet } from '@/utils/idb'
import { MAP_DEVICES, thSiteOf, vocSiteOf } from '@/constants/mapSites'

const ROWS_VERSION = 'v1'
const HOURS = 24
const TH_METRICS = ['pm25', 'pm10', 'temperature', 'humidity', 'noise', 'illumination']
const VOC_METRICS = ['voc', 'o3', 'so2', 'no2']

const rowsKey = (id) => `rows:${id}:24h:${ROWS_VERSION}`
const latestKey = (id) => `latest:${id}`



// Small concurrency limiter (no external deps)
function pLimit(max) {
  const queue = []
  let active = 0
  const next = () => {
    if (active >= max || queue.length === 0) return
    active++
    const { fn, resolve, reject } = queue.shift()
    fn().then(resolve, reject).finally(() => {
      active--
      next()
    })
  }
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    next()
  })
}

// Build rows array (same shape your page expects)
function buildRowsFromSeries(id, thSeries, vocSeries) {
  const pick = (seriesObj, isTH, key) => {
    const arr = isTH ? (seriesObj?.[thSiteOf(id)] || []) : (seriesObj?.[vocSiteOf(id)] || [])
    return (arr || []).map(d => ({ ts: d.ts, value: d.value ?? d[key] }))
  }
  const makeRow = (isTH, key, label, unit, s) => ({ key, label, unit, points: s ? pick(s, isTH, key) : [] })

  const labels = {
    pm25: 'PM2.5', pm10: 'PM10', temperature: 'Temp', humidity: 'Humidity',
    noise: 'Noise', illumination: 'Illumination', voc: 'VOC', o3: 'O₃', so2: 'SO₂', no2: 'NO₂'
  }
  const units = {
    pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°C', humidity: '%',
    noise: 'dB', illumination: 'lx', voc: 'ppm', o3: 'ppm', so2: 'ppm', no2: 'ppm'
  }

  const out = []
  out.push(makeRow(true,  'pm25',        labels.pm25,        units.pm25,        thSeries[0]))
  out.push(makeRow(true,  'pm10',        labels.pm10,        units.pm10,        thSeries[1]))
  out.push(makeRow(true,  'temperature', labels.temperature, units.temperature, thSeries[2]))
  out.push(makeRow(true,  'humidity',    labels.humidity,    units.humidity,    thSeries[3]))
  out.push(makeRow(true,  'noise',       labels.noise,       units.noise,       thSeries[4]))
  out.push(makeRow(true,  'illumination',labels.illumination,units.illumination,thSeries[5]))
  out.push(makeRow(false, 'voc',         labels.voc,         units.voc,         vocSeries[0]))
  out.push(makeRow(false, 'o3',          labels.o3,          units.o3,          vocSeries[1]))
  out.push(makeRow(false, 'so2',         labels.so2,         units.so2,         vocSeries[2]))
  out.push(makeRow(false, 'no2',         labels.no2,         units.no2,         vocSeries[3]))
  return out.filter(r => (r.points?.length || 0) > 0)
}

async function warmOneDevice(id) {
  // latest
  const latestMap = await api.getLatestReadings({ hours: HOURS })
  const th = latestMap[thSiteOf(id)] || null
  const voc = latestMap[vocSiteOf(id)] || null
  await idbSet(latestKey(id), { latest: { th, voc }, cachedAt: Date.now() })

  // series (parallel)
  const thPromises  = TH_METRICS.map(metric => api.getTimeseriesByMetric({ metric, siteIds: [thSiteOf(id)], hours: HOURS }))
  const vocPromises = VOC_METRICS.map(metric => api.getTimeseriesByMetric({ metric, siteIds: [vocSiteOf(id)], hours: HOURS }))
  const [thSeries, vocSeries] = await Promise.all([Promise.all(thPromises), Promise.all(vocPromises)])

  const rows = buildRowsFromSeries(id, thSeries, vocSeries)
  const maxTs = rows.reduce((m, r) => {
    for (const p of r.points || []) {
      const t = Date.parse(p.ts)
      if (Number.isFinite(t) && t > m) m = t
    }
    return m
  }, -Infinity)

  await idbSet(rowsKey(id), { rows, cachedAt: Date.now(), maxTs: Number.isFinite(maxTs) ? maxTs : null })
}

/**
 * Public API
 * - preloads the first `count` devices by default (can pass a custom list)
 * - respects Save-Data and slow network
 */
export async function preloadDevicesPage({ devices = MAP_DEVICES, count = 4, concurrency = 2 } = {}) {
  // Respect user’s data saver & slow network
  const nc = navigator.connection
  if (nc?.saveData) return
  if (nc && (nc.effectiveType === '2g' || nc.effectiveType === 'slow-2g')) return

  // Only preload a handful to keep startup light
  const targets = devices.slice(0, count).map(d => d.id)
  const limit = pLimit(concurrency)

  // Kick off in the background, don’t throw globally
  await Promise.allSettled(targets.map(id => limit(() => warmOneDevice(id))))
}
