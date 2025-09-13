
import axios from "axios"
import { MAP_DEVICES, MAP_SITES_V6 } from "@/constants/mapSites"

// Toggle via .env 
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").trim()
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || "false").toLowerCase() === "true"

// When mock mode is on, import the generator
let mock = null
if (USE_MOCK) {
  mock = await import("@/mocks/generator")
}

// ---------- HTTP ----------
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  paramsSerializer: {
    serialize: (params) =>
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&"),
  },
})

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (import.meta.env.DEV) {
      console.error("[API ERROR]", err?.response?.status, err?.response?.data || err.message)
    }
    throw err
  }
)

// ---------- Time helpers (UTC SQL strings) ----------
export function toUtcSql(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const pad = (n) => String(n).padStart(2, "0")
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ${pad(
    dt.getUTCHours()
  )}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`
}

/** Parse "YYYY-MM-DD HH:mm:ss" (UTC) to ms timestamp */
export function parseUtcSql(s) {
  if (!s || typeof s !== "string") return NaN

  // 1) Try native ISO parser first (handles ...T...Z, fractional seconds, etc.)
  const iso = Date.parse(s)
  if (Number.isFinite(iso)) return iso

  // 2) Fallback: "YYYY-MM-DD HH:mm:ss" (UTC)
  const [d, t] = s.trim().split(/[ T]/)   // allow either space or 'T'
  if (!d || !t) return NaN
  const [Y, M, D] = d.split("-").map(Number)
  const [h, m, secRaw] = t.split(":")
  const [sInt] = String(secRaw ?? "0").split(".")   // strip any .sss
  const [hh, mm, ss] = [Number(h), Number(m), Number(sInt)]
  return Date.UTC(Y, (M || 1) - 1, D || 1, hh || 0, mm || 0, ss || 0)
}

/** Last N hours as [start_utc_sql, end_utc_sql] */
export function lastHours(hours = 6, end = Date.now()) {
  const endDate = new Date(end)
  const startDate = new Date(end - hours * 3600 * 1000)
  return [toUtcSql(startDate), toUtcSql(endDate)]
}

// ---------- Normalizers (live -> UI shape) ----------
function mapTHRow(r) {
  const rep = parseUtcSql(r.ReportedTimeUTC)
  const rec = parseUtcSql(r.ReceivedTime)
  const lastSeenMs = Number.isFinite(rep) || Number.isFinite(rec) ? Math.max(rep || 0, rec || 0) : null

  // Canonical values
  const temperature   = r.Temperature   != null ? Number(r.Temperature)   : null
  const humidity      = r.Humidity      != null ? Number(r.Humidity)      : null
  const illumination  = r.Illumination  != null ? Number(r.Illumination)  : null
  const noise         = r.Noise         != null ? Number(r.Noise)         : null
  const pm25          = r.PM2_5         != null ? Number(r.PM2_5)         : null
  const pm10          = r.PM10          != null ? Number(r.PM10)          : null

  return {
    site: r.SiteName,

    // Canonical keys (use these everywhere going forward)
    temperature,       // °C
    humidity,          // %
    illumination,      // lux (or native unit)
    noise,             // dB
    pm25,              // µg/m³
    pm10,              // µg/m³

    // Aliases to keep existing UI working
    tempC: temperature,
    rh: humidity,
    illum: illumination,

    reportedUTC: r.ReportedTimeUTC,
    receivedUTC: r.ReceivedTime,
    ts: rep,
    lastSeenMs,
  }
}

function mapVOCRow(r) {
  const rep = parseUtcSql(r.ReportedTimeUTC)
  const rec = parseUtcSql(r.ReceivedTime)
  const lastSeenMs = Number.isFinite(rep) || Number.isFinite(rec) ? Math.max(rep || 0, rec || 0) : null
  return {
    site: r.SiteName,
    voc: r.VOC != null ? Number(r.VOC) : null,
    o3: r.O3 != null ? Number(r.O3) : null,
    so2: r.SO2 != null ? Number(r.SO2) : null,
    no2: r.NO2 != null ? Number(r.NO2) : null,
    reportedUTC: r.ReportedTimeUTC,
    receivedUTC: r.ReceivedTime,
    ts: rep,
    lastSeenMs,
  }
}

// ---------- LIVE IMPLEMENTATION ----------
async function live_health() {
  const { data } = await http.get("/v6/health")
  return data
}
async function live_getSites() {
  const { data } = await http.get("/v6/sites")
  return Array.isArray(data) ? data : (data?.sites ?? [])
}
async function live_queryTH(params) {
  const { start_time, end_time } = params ?? {}
  if (!start_time || !end_time) throw new Error("queryTH requires start_time and end_time")
  const { data } = await http.get("/v6/th", { params })
  return Array.isArray(data) ? data.map(mapTHRow) : []
}
async function live_queryVOC(params) {
  const { start_time, end_time } = params ?? {}
  if (!start_time || !end_time) throw new Error("queryVOC requires start_time and end_time")
  const { data } = await http.get("/v6/voc", { params })
  return Array.isArray(data) ? data.map(mapVOCRow) : []
}
async function live_getLatestForSite(site_name, { hours = 12 } = {}) {
  const [start_time, end_time] = lastHours(hours)
  const isTH = site_name.includes("-TH-")
  const endpoint = isTH ? "/v6/th" : "/v6/voc"
  const { data } = await http.get(endpoint, { params: { start_time, end_time, site_name } })
  if (!Array.isArray(data) || data.length === 0) return null
  const newest = data.reduce((a, b) =>
    parseUtcSql(a.ReportedTimeUTC) >= parseUtcSql(b.ReportedTimeUTC) ? a : b
  )
  return isTH ? mapTHRow(newest) : mapVOCRow(newest)
}
async function live_getLatestReadings({ hours = 12 } = {}) {
  const sites = await live_getSites()
  const pairs = await Promise.all(
    sites.map((s) => live_getLatestForSite(s, { hours }).then((r) => [s, r]))
  )
  return Object.fromEntries(pairs)
}
async function live_getTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  const [start_time, end_time] = lastHours(hours)
  const TH_KEYS = ["pm25", "pm10", "temperature", "humidity", "noise", "illumination"]
  const isTH = TH_KEYS.includes(metric)
  const endpointFn = isTH ? live_queryTH : live_queryVOC

  let targets = siteIds
  if (!targets.length) {
    const all = await live_getSites()
    targets = all.filter((s) => (isTH ? s.includes("-TH-") : s.includes("-VOC-")))
  }

  const perSite = await Promise.all(
    targets.map(async (site_name) => {
      const rows = await endpointFn({ start_time, end_time, site_name })
      const series = rows
        .map((r) => {
          let v
          switch (metric) {
            case "pm25": v = r.pm25; break
            case "pm10": v = r.pm10; break
            case "temperature": v = r.temperature; break
            case "humidity": v = r.humidity; break
            case "noise": v = r.noise; break
            case "illumination": v = r.illumination; break
            case "voc": v = r.voc; break
            case "o3": v = r.o3; break
            case "so2": v = r.so2; break
            case "no2": v = r.no2; break
            default: v = undefined
          }
          const ts = Number(r.ts)
          const val = Number(v)
          return (Number.isFinite(ts) && Number.isFinite(val)) ? { ts, value: val } : null
        })
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts)
      return [site_name, series]
    })
  )
  return Object.fromEntries(perSite)
}

// ---------- MOCK IMPLEMENTATION (wired only when USE_MOCK=true) ----------
async function mock_health() {
  return { status: "mock", version: "v6", features: ["site_filtering", "time_range_query"] }
}
async function mock_getSites() {
  return mock.genSites()
}
async function mock_queryTH(params) {
  const rows = await mock.genTHRows(params)
  // reuse live normalizers to keep UI shape identical
  return rows.map((r) => mapTHRow(r))
}
async function mock_queryVOC(params) {
  const rows = await mock.genVOCRows(params)
  return rows.map((r) => mapVOCRow(r))
}
async function mock_getLatestReadings({ hours = 12 } = {}) {
  const [start_time, end_time] = lastHours(hours)
  const sites = await mock_getSites()
  const th = await mock.genTHRows({ start_time, end_time })
  const voc = await mock.genVOCRows({ start_time, end_time })
  const latest = mock.pickLatestBySite(sites, th, voc)
  return latest
}
async function mock_getTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  return mock.genTimeseriesByMetric({ metric, siteIds, hours })
}

// ---------- Public surface ----------
export const api = USE_MOCK
  ? {
      health: () => mock_health(),
      getSites: () => mock_getSites(),
      queryTH: (p) => mock_queryTH(p),
      queryVOC: (p) => mock_queryVOC(p),
      getLatestReadings: (opts = {}) => mock_getLatestReadings(opts),
      getTimeseriesByMetric: (opts = {}) => mock_getTimeseriesByMetric(opts),
      getMapDevices: () => MAP_DEVICES,

    }
  : {
      health: () => live_health(),
      getSites: () => live_getSites(),
      queryTH: (p) => live_queryTH(p),
      queryVOC: (p) => live_queryVOC(p),
      getLatestReadings: (opts = {}) => live_getLatestReadings(opts),
      getTimeseriesByMetric: (opts = {}) => live_getTimeseriesByMetric(opts),
      getMapDevices: () => MAP_DEVICES,
  }
    

export { MAP_DEVICES, MAP_SITES_V6 }
