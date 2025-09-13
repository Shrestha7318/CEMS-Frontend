// src/mocks/generator.js

// ──────────────────────────────────────────────────────────────────────────────
// Hardcoded map catalog (10 devices → each has TH and VOC sites)
// ──────────────────────────────────────────────────────────────────────────────
export const MAP_DEVICES = [
  { id: "UTIS0001", name: "Ingleside on the Bay", lat: 27.8240, lon: -97.2130 },
  { id: "UTIS0002", name: "IOB Sandpiper",        lat: 27.8235, lon: -97.0660 },
  { id: "UTIS0003", name: "IOB Sunset",           lat: 27.8420, lon: -97.0930 },
  { id: "UTIS0004", name: "Gregory",              lat: 27.9220, lon: -97.2925 },
  { id: "UTIS0005", name: "Hillcrest",            lat: 27.8090, lon: -97.4070 },
  { id: "UTIS0006", name: "South Exxon-Sabic",    lat: 27.9000, lon: -97.3200 },
  { id: "UTIS0007", name: "North Exxon-Sabic",    lat: 27.9300, lon: -97.3200 },
  { id: "UTIS0008", name: "Port Aransas",         lat: 27.8339, lon: -97.0611 },
  { id: "UTIS0009", name: "Aransas Pass",         lat: 27.9095, lon: -97.1500 },
  { id: "UTIS0010", name: "Ingleside",            lat: 27.8800, lon: -97.2100 },
]

// V6 site naming helpers (matches the spec) :contentReference[oaicite:1]{index=1}
export const thSiteOf  = (baseId) => `${baseId}-TH-V6_1`
export const vocSiteOf = (baseId) => `${baseId}-VOC-V6_1`

// Full list of site names used by the mock: TH + VOC for each device (20 total)
export const MAP_SITES_V6 = MAP_DEVICES.flatMap(d => [thSiteOf(d.id), vocSiteOf(d.id)])

// ──────────────────────────────────────────────────────────────────────────────
// Small time helpers (UTC SQL strings)
// ──────────────────────────────────────────────────────────────────────────────
function toUtcSql(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const pad = (n) => String(n).padStart(2, "0")
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ${pad(
    dt.getUTCHours()
  )}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`
}
function parseUtcSql(s) {
  if (!s || typeof s !== "string") return NaN
  const [d, t] = s.trim().split(" ")
  if (!d || !t) return NaN
  const [Y, M, D] = d.split("-").map(Number)
  const [h, m, sec] = t.split(":").map(Number)
  return Date.UTC(Y, (M || 1) - 1, D || 1, h || 0, m || 0, sec || 0)
}
function lastHours(hours = 24, end = Date.now()) {
  const endDate = new Date(end)
  const startDate = new Date(end - hours * 3600 * 1000)
  return [toUtcSql(startDate), toUtcSql(endDate)]
}

// ──────────────────────────────────────────────────────────────────────────────
/** Deterministic PRNG + helpers */
// ──────────────────────────────────────────────────────────────────────────────
function seedRand(seed = 1234567) {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) / 4294967296)
  }
}
function hashString(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return (h >>> 0)
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

// ──────────────────────────────────────────────────────────────────────────────
// Sites API (mock): always return the 20 TH/VOC site names from the 10 pins
// ──────────────────────────────────────────────────────────────────────────────
export function genSites() {
  // Mirrors GET /api/v6/sites result list (names only) :contentReference[oaicite:2]{index=2}
  return MAP_SITES_V6.slice()
}

// ──────────────────────────────────────────────────────────────────────────────
// Time iterator + param range handling
// ──────────────────────────────────────────────────────────────────────────────
function* iter5m(startMs, endMs) {
  for (let t = startMs; t <= endMs; t += 5 * 60 * 1000) yield t
}
function rangeFromParams(params = {}) {
  let { start_time, end_time } = params
  if (!start_time || !end_time) {
    ;[start_time, end_time] = lastHours(24)
  }
  const startMs = parseUtcSql(start_time)
  const endMs = parseUtcSql(end_time)
  return { start_time, end_time, startMs, endMs }
}

// ──────────────────────────────────────────────────────────────────────────────
// TH rows (API payload shape), 5-minute cadence
// ──────────────────────────────────────────────────────────────────────────────
export async function genTHRows(params = {}) {
  const { startMs, endMs } = rangeFromParams(params)
  const sites = params.site_name ? [params.site_name] : genSites()
  const thSites = sites.filter((s) => s.includes("-TH-"))
  const out = []
  for (const site of thSites) {
    const rnd = seedRand(hashString(site))
    let temperature = 20 + rnd() * 10
    let humidity    = 40 + rnd() * 40
    let noise       = 42 + rnd() * 10
    let pm25        = 8  + rnd() * 25
    let pm10        = 15 + rnd() * 45
    let illum       = 600 + rnd() * 600
    for (const t of iter5m(startMs, endMs)) {
      temperature = clamp(temperature + (rnd() - 0.5) * 0.30, -20, 55)
      humidity    = clamp(humidity    + (rnd() - 0.5) * 1.00, 0, 100)
      noise       = clamp(noise       + (rnd() - 0.5) * 1.20, 20, 90)
      pm25        = clamp(pm25        + (rnd() - 0.5) * 1.30, 0, 500)
      pm10        = clamp(pm10        + (rnd() - 0.5) * 1.80, 0, 600)
      illum       = clamp(illum       + (rnd() - 0.5) * 25,   0, 2000)
      const ts = toUtcSql(new Date(t))
      out.push({
        SiteName:        site,
        Humidity:        humidity.toFixed(2),
        Temperature:     temperature.toFixed(2),
        Noise:           noise.toFixed(2),
        PM2_5:           pm25.toFixed(2),
        PM10:            pm10.toFixed(2),
        ReceivedTime:    ts,
        ReportedTimeUTC: ts,
        Illumination:    illum.toFixed(2),
      })
    }
  }
  return out
}

// ──────────────────────────────────────────────────────────────────────────────
/** VOC rows (API payload shape), 5-minute cadence */
// ──────────────────────────────────────────────────────────────────────────────
export async function genVOCRows(params = {}) {
  const { startMs, endMs } = rangeFromParams(params)
  const sites = params.site_name ? [params.site_name] : genSites()
  const vocSites = sites.filter((s) => s.includes("-VOC-"))
  const out = []
  for (const site of vocSites) {
    const rnd = seedRand(hashString(site))
    let voc  = 0.12 + rnd() * 0.08
    let o3   = 0.03 + rnd() * 0.03
    let so2  = 0.01 + rnd() * 0.01
    let no2  = 0.02 + rnd() * 0.02
    for (const t of iter5m(startMs, endMs)) {
      voc  = clamp(voc  + (rnd() - 0.5) * 0.004,  0, 5)
      o3   = clamp(o3   + (rnd() - 0.5) * 0.002,  0, 1)
      so2  = clamp(so2  + (rnd() - 0.5) * 0.001,  0, 1)
      no2  = clamp(no2  + (rnd() - 0.5) * 0.0015, 0, 1)
      const ts = toUtcSql(new Date(t))
      out.push({
        SiteName:        site,
        ReportedTimeUTC: ts,
        VOC:             voc.toFixed(4),
        O3:              o3.toFixed(4),
        SO2:             so2.toFixed(4),
        NO2:             no2.toFixed(4),
        ReceivedTime:    ts,
      })
    }
  }
  return out
}

// ──────────────────────────────────────────────────────────────────────────────
/** Latest-per-site picker (used by SensorTable aggregation) */
// ──────────────────────────────────────────────────────────────────────────────
export function pickLatestBySite(allSites, thRows, vocRows) {
  const latestMap = {}
  const thBySite = new Map()
  const vocBySite = new Map()

  for (const r of thRows) {
    const prev = thBySite.get(r.SiteName)
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) {
      thBySite.set(r.SiteName, r)
    }
  }
  for (const r of vocRows) {
    const prev = vocBySite.get(r.SiteName)
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) {
      vocBySite.set(r.SiteName, r)
    }
  }

  for (const site of allSites) {
    const r = site.includes("-TH-") ? thBySite.get(site) : vocBySite.get(site)
    latestMap[site] = r
      ? (site.includes("-TH-")
          ? {
              site,
              pm25: Number(r.PM2_5),
              pm10: Number(r.PM10),
              temperature: Number(r.Temperature),
              humidity: Number(r.Humidity),
              noise: Number(r.Noise),
              illumination: Number(r.Illumination),
              reportedUTC: r.ReportedTimeUTC,
              receivedUTC: r.ReceivedTime,
              ts: parseUtcSql(r.ReportedTimeUTC),
              lastSeenMs: parseUtcSql(r.ReportedTimeUTC),
            }
          : {
              site,
              voc: Number(r.VOC),
              o3: Number(r.O3),
              so2: Number(r.SO2),
              no2: Number(r.NO2),
              reportedUTC: r.ReportedTimeUTC,
              receivedUTC: r.ReceivedTime,
              ts: parseUtcSql(r.ReportedTimeUTC),
              lastSeenMs: parseUtcSql(r.ReportedTimeUTC),
            })
      : null
  }
  return latestMap
}

// ──────────────────────────────────────────────────────────────────────────────
/** Metric timeseries for CompareChart.vue
 *  Returns: { [siteName]: [{ ts, value }, ...] }
 */
// ──────────────────────────────────────────────────────────────────────────────
export async function genTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  const [start_time, end_time] = lastHours(hours)
  const TH_KEYS = ["pm25", "pm10", "temperature", "humidity", "noise", "illumination"]
  const isTH = TH_KEYS.includes(metric)

  const targets = (siteIds.length ? siteIds : genSites().filter(s => isTH ? s.includes("-TH-") : s.includes("-VOC-")))
  const rows = isTH ? await genTHRows({ start_time, end_time }) : await genVOCRows({ start_time, end_time })

  const bySite = new Map(targets.map((s) => [s, []]))
  for (const r of rows) {
    const site = r.SiteName
    if (!bySite.has(site)) continue
    const ts = parseUtcSql(r.ReportedTimeUTC)
    let val
    if (isTH) {
      switch (metric) {
        case "pm25":        val = Number(r.PM2_5); break
        case "pm10":        val = Number(r.PM10); break
        case "temperature": val = Number(r.Temperature); break
        case "humidity":    val = Number(r.Humidity); break
        case "noise":       val = Number(r.Noise); break
        case "illumination":val = Number(r.Illumination); break
      }
    } else {
      switch (metric) {
        case "voc": val = Number(r.VOC); break
        case "o3":  val = Number(r.O3);  break
        case "so2": val = Number(r.SO2); break
        case "no2": val = Number(r.NO2); break
      }
    }
    if (Number.isFinite(ts) && Number.isFinite(val)) bySite.get(site).push({ ts, value: val })
  }

  const out = {}
  for (const [site, arr] of bySite) out[site] = arr.sort((a, b) => a.ts - b.ts)
  return out
}
