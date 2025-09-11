

// ---- small time helpers (UTC) ----
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

// ---- utils ----
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

// ---- sites ----
export function genSites(count = 6) {
  const n = Math.max(2, Math.floor(count / 2))
  const out = []
  for (let i = 1; i <= n; i++) {
    const num = String(i).padStart(4, "0")
    out.push(`UTIS${num}-TH-V6_1`)
    out.push(`UTIS${num}-VOC-V6_1`)
  }
  return out
}

// ---- time iterator ----
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

// ---- TH rows (API shape) ----
export async function genTHRows(params = {}) {
  const { startMs, endMs } = rangeFromParams(params)
  const sites = params.site_name ? [params.site_name] : genSites()
  const thSites = sites.filter((s) => s.includes("-TH-"))
  const out = []
  for (const site of thSites) {
    const rnd = seedRand(hashString(site))
    let temperature = 20 + rnd() * 10
    let humidity = 40 + rnd() * 40
    let noise = 42 + rnd() * 10
    let pm25 = 8 + rnd() * 25
    let pm10 = 15 + rnd() * 45
    let illum = 600 + rnd() * 600
    for (const t of iter5m(startMs, endMs)) {
      temperature = clamp(temperature + (rnd() - 0.5) * 0.3, -20, 55)
      humidity = clamp(humidity + (rnd() - 0.5) * 1.0, 0, 100)
      noise = clamp(noise + (rnd() - 0.5) * 1.2, 20, 90)
      pm25 = clamp(pm25 + (rnd() - 0.5) * 1.3, 0, 500)
      pm10 = clamp(pm10 + (rnd() - 0.5) * 1.8, 0, 600)
      illum = clamp(illum + (rnd() - 0.5) * 25, 0, 2000)
      const ts = toUtcSql(new Date(t))
      out.push({
        SiteName: site,
        Humidity: (humidity).toFixed(2),
        Temperature: (temperature).toFixed(2),
        Noise: (noise).toFixed(2),
        PM2_5: (pm25).toFixed(2),
        PM10: (pm10).toFixed(2),
        ReceivedTime: ts,
        ReportedTimeUTC: ts,
        Illumination: (illum).toFixed(2),
      })
    }
  }
  return out
}

// ---- VOC rows (API shape) ----
export async function genVOCRows(params = {}) {
  const { startMs, endMs } = rangeFromParams(params)
  const sites = params.site_name ? [params.site_name] : genSites()
  const vocSites = sites.filter((s) => s.includes("-VOC-"))
  const out = []
  for (const site of vocSites) {
    const rnd = seedRand(hashString(site))
    let voc = 0.12 + rnd() * 0.08
    let o3 = 0.03 + rnd() * 0.03
    let so2 = 0.01 + rnd() * 0.01
    let no2 = 0.02 + rnd() * 0.02
    for (const t of iter5m(startMs, endMs)) {
      voc = clamp(voc + (rnd() - 0.5) * 0.004, 0, 5)
      o3 = clamp(o3 + (rnd() - 0.5) * 0.002, 0, 1)
      so2 = clamp(so2 + (rnd() - 0.5) * 0.001, 0, 1)
      no2 = clamp(no2 + (rnd() - 0.5) * 0.0015, 0, 1)
      const ts = toUtcSql(new Date(t))
      out.push({
        SiteName: site,
        ReportedTimeUTC: ts,
        VOC: (voc).toFixed(4),
        O3: (o3).toFixed(4),
        SO2: (so2).toFixed(4),
        NO2: (no2).toFixed(4),
        ReceivedTime: ts,
      })
    }
  }
  return out
}

// ---- latest picker (for SensorTable) ----
export function pickLatestBySite(allSites, thRows, vocRows) {
  const latestMap = {}
  const thBySite = new Map()
  const vocBySite = new Map()
  for (const r of thRows) {
    const prev = thBySite.get(r.SiteName)
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) thBySite.set(r.SiteName, r)
  }
  for (const r of vocRows) {
    const prev = vocBySite.get(r.SiteName)
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) vocBySite.set(r.SiteName, r)
  }
  for (const site of allSites) {
    const r = site.includes("-TH-") ? thBySite.get(site) : vocBySite.get(site)
    latestMap[site] = r
      ? (site.includes("-TH-")
          ? { site, pm25: Number(r.PM2_5), pm10: Number(r.PM10), temperature: Number(r.Temperature), humidity: Number(r.Humidity), noise: Number(r.Noise), illumination: Number(r.Illumination), reportedUTC: r.ReportedTimeUTC, receivedUTC: r.ReceivedTime, ts: parseUtcSql(r.ReportedTimeUTC), lastSeenMs: parseUtcSql(r.ReportedTimeUTC) }
          : { site, voc: Number(r.VOC), o3: Number(r.O3), so2: Number(r.SO2), no2: Number(r.NO2), reportedUTC: r.ReportedTimeUTC, receivedUTC: r.ReceivedTime, ts: parseUtcSql(r.ReportedTimeUTC), lastSeenMs: parseUtcSql(r.ReportedTimeUTC) })
      : null
  }
  return latestMap
}

// ---- metric timeseries (for CompareChart) ----
export async function genTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  const [start_time, end_time] = lastHours(hours)

  const TH_KEYS = ["pm25", "pm10", "temperature", "humidity", "noise", "illumination"]
  const isTH = TH_KEYS.includes(metric)

  let targets = siteIds.length ? siteIds : genSites().filter((s) => (isTH ? s.includes("-TH-") : s.includes("-VOC-")))
  const rows = isTH ? await genTHRows({ start_time, end_time }) : await genVOCRows({ start_time, end_time })

  const bySite = new Map(targets.map((s) => [s, []]))
  for (const r of rows) {
    const site = r.SiteName
    if (!bySite.has(site)) continue
    const ts = parseUtcSql(r.ReportedTimeUTC)
    let val
    if (isTH) {
      switch (metric) {
        case "pm25": val = Number(r.PM2_5); break
        case "pm10": val = Number(r.PM10); break
        case "temperature": val = Number(r.Temperature); break
        case "humidity": val = Number(r.Humidity); break
        case "noise": val = Number(r.Noise); break
        case "illumination": val = Number(r.Illumination); break
      }
    } else {
      switch (metric) {
        case "voc": val = Number(r.VOC); break
        case "o3": val = Number(r.O3); break
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
