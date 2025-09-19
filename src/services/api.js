// src/services/api.js
import axios from "axios";
import { MAP_DEVICES, MAP_SITES_V6 } from "@/constants/mapSites";
import { cacheGet, cacheSet } from "@/utils/idb"; // NEW

// Toggle via .env 
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").trim();
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || "false").toLowerCase() === "true";

// Zero filtering toggle (default ON)
const IGNORE_ZERO = String(import.meta.env.VITE_IGNORE_ZERO_READINGS ?? "true").toLowerCase() === "true";

/* ---------------- Number helpers ---------------- */
function toNumOrNull(v, { rejectZeros = IGNORE_ZERO, epsilon = 1e-9 } = {}) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (rejectZeros && Math.abs(n) <= epsilon) return null;
  return n;
}

/* ---------------- Mock loader ---------------- */
let mock = null;
if (USE_MOCK) {
  mock = await import("@/mocks/generator");
}

/* ---------------- HTTP ---------------- */
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  paramsSerializer: {
    serialize: (params) =>
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&"),
  },
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (import.meta.env.DEV) {
      console.error("[API ERROR]", err?.response?.status, err?.response?.data || err.message);
    }
    throw err;
  }
);

/* ---------------- Time helpers (UTC SQL strings) ---------------- */
export function toUtcSql(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ${pad(
    dt.getUTCHours()
  )}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`;
}

export function parseUtcSql(s) {
  if (!s || typeof s !== "string") return NaN;
  const iso = Date.parse(s);
  if (Number.isFinite(iso)) return iso;
  const [d, t] = s.trim().split(/[ T]/);
  if (!d || !t) return NaN;
  const [Y, M, D] = d.split("-").map(Number);
  const [h, m, secRaw] = t.split(":");
  const [sInt] = String(secRaw ?? "0").split(".");
  const [hh, mm, ss] = [Number(h), Number(m), Number(sInt)];
  return Date.UTC(Y, (M || 1) - 1, D || 1, hh || 0, mm || 0, ss || 0);
}

export function lastHours(hours = 6, end = Date.now()) {
  const endDate = new Date(end);
  const startDate = new Date(end - hours * 3600 * 1000);
  return [toUtcSql(startDate), toUtcSql(endDate)];
}

/* ---------------- Normalizers (live -> UI shape) ---------------- */
function mapTHRow(r) {
  const rep = parseUtcSql(r.ReportedTimeUTC);
  const rec = parseUtcSql(r.ReceivedTime);
  const lastSeenMs = Number.isFinite(rep) || Number.isFinite(rec) ? Math.max(rep || 0, rec || 0) : null;

  const temperature   = toNumOrNull(r.Temperature);
  const humidity      = toNumOrNull(r.Humidity);
  const illumination  = toNumOrNull(r.Illumination);
  const noise         = toNumOrNull(r.Noise);
  const pm25          = toNumOrNull(r.PM2_5);
  const pm10          = toNumOrNull(r.PM10);

  return {
    site: r.SiteName,
    temperature, humidity, illumination, noise, pm25, pm10,
    tempC: temperature, rh: humidity, illum: illumination,
    reportedUTC: r.ReportedTimeUTC,
    receivedUTC: r.ReceivedTime,
    ts: rep,
    lastSeenMs,
  };
}

function mapVOCRow(r) {
  const rep = parseUtcSql(r.ReportedTimeUTC);
  const rec = parseUtcSql(r.ReceivedTime);
  const lastSeenMs = Number.isFinite(rep) || Number.isFinite(rec) ? Math.max(rep || 0, rec || 0) : null;
  return {
    site: r.SiteName,
    voc: toNumOrNull(r.VOC),
    o3:  toNumOrNull(r.O3),
    so2: toNumOrNull(r.SO2),
    no2: toNumOrNull(r.NO2),
    reportedUTC: r.ReportedTimeUTC,
    receivedUTC: r.ReceivedTime,
    ts: rep,
    lastSeenMs,
  };
}

/* ---------------- LIVE IMPLEMENTATION ---------------- */
async function live_health() {
  const { data } = await http.get("/v6/health");
  return data;
}
async function live_getSites() {
  const { data } = await http.get("/v6/sites");
  return Array.isArray(data) ? data : (data?.sites ?? []);
}
async function live_queryTH(params) {
  const { start_time, end_time } = params ?? {};
  if (!start_time || !end_time) throw new Error("queryTH requires start_time and end_time");
  const { data } = await http.get("/v6/th", { params });
  return Array.isArray(data) ? data.map(mapTHRow) : [];
}
async function live_queryVOC(params) {
  const { start_time, end_time } = params ?? {};
  if (!start_time || !end_time) throw new Error("queryVOC requires start_time and end_time");
  const { data } = await http.get("/v6/voc", { params });
  return Array.isArray(data) ? data.map(mapVOCRow) : [];
}
async function live_getLatestForSite(site_name, { hours = 12 } = {}) {
  const [start_time, end_time] = lastHours(hours);
  const isTH = site_name.includes("-TH-");
  const endpoint = isTH ? "/v6/th" : "/v6/voc";
  const { data } = await http.get(endpoint, { params: { start_time, end_time, site_name } });
  if (!Array.isArray(data) || data.length === 0) return null;

  const normalized = (isTH ? data.map(mapTHRow) : data.map(mapVOCRow)).filter((r) => {
    const vals = isTH
      ? [r.pm25, r.pm10, r.temperature, r.humidity, r.noise, r.illumination]
      : [r.voc, r.o3, r.so2, r.no2];
    return vals.some((v) => v != null);
  });

  if (!normalized.length) return null;

  const newest = normalized.reduce((a, b) =>
    parseUtcSql(a.reportedUTC) >= parseUtcSql(b.reportedUTC) ? a : b
  );
  return newest;
}
async function live_getLatestReadings({ hours = 12 } = {}) {
  const sites = await live_getSites();
  const pairs = await Promise.all(
    sites.map((s) => live_getLatestForSite(s, { hours }).then((r) => [s, r]))
  );
  return Object.fromEntries(pairs);
}
async function live_getTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  const [start_time, end_time] = lastHours(hours);
  const TH_KEYS = ["pm25", "pm10", "temperature", "humidity", "noise", "illumination"];
  const isTH = TH_KEYS.includes(metric);
  const endpointFn = isTH ? live_queryTH : live_queryVOC;

  let targets = siteIds;
  if (!targets.length) {
    const all = await live_getSites();
    targets = all.filter((s) => (isTH ? s.includes("-TH-") : s.includes("-VOC-")));
  }

  const perSite = await Promise.all(
    targets.map(async (site_name) => {
      const rows = await endpointFn({ start_time, end_time, site_name });
      const series = rows
        .map((r) => {
          let v;
          switch (metric) {
            case "pm25": v = r.pm25; break;
            case "pm10": v = r.pm10; break;
            case "temperature": v = r.temperature; break;
            case "humidity": v = r.humidity; break;
            case "noise": v = r.noise; break;
            case "illumination": v = r.illumination; break;
            case "voc": v = r.voc; break;
            case "o3": v = r.o3; break;
            case "so2": v = r.so2; break;
            case "no2": v = r.no2; break;
            default: v = undefined;
          }
          const ts = Number(r.ts);
          if (!Number.isFinite(ts) || v == null) return null;
          return { ts, value: v };
        })
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts);
      return [site_name, series];
    })
  );
  return Object.fromEntries(perSite);
}

/* ---------------- MOCK IMPLEMENTATION ---------------- */
async function mock_health() {
  return { status: "mock", version: "v6", features: ["site_filtering", "time_range_query"] };
}
async function mock_getSites() {
  return mock.genSites();
}
async function mock_queryTH(params) {
  const rows = await mock.genTHRows(params);
  return rows.map((r) => mapTHRow(r));
}
async function mock_queryVOC(params) {
  const rows = await mock.genVOCRows(params);
  return rows.map((r) => mapVOCRow(r));
}
async function mock_getLatestReadings({ hours = 12 } = {}) {
  const [start_time, end_time] = lastHours(hours);
  const sites = await mock_getSites();
  const th = await mock.genTHRows({ start_time, end_time });
  const voc = await mock.genVOCRows({ start_time, end_time });
  const latest = mock.pickLatestBySite(sites, th, voc);

  const norm = Object.fromEntries(
    Object.entries(latest).map(([site, raw]) => {
      if (!raw) return [site, null];
      const r = site.includes("-TH-") ? mapTHRow(raw) : mapVOCRow(raw);
      const vals = site.includes("-TH-")
        ? [r.pm25, r.pm10, r.temperature, r.humidity, r.noise, r.illumination]
        : [r.voc, r.o3, r.so2, r.no2];
      return [site, vals.some((v) => v != null) ? r : null];
    })
  );
  return norm;
}
async function mock_getTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  return mock.genTimeseriesByMetric({ metric, siteIds, hours });
}

/* ----------------- CACHE KEYS & HELPERS ------------------ */
// Cache TTLs (tune as needed)
const TTL = {
  sites: 12 * 60 * 60 * 1000,          // 12h
  latest: 2 * 60 * 1000,               // 2min (SensorTable fast)
  ts24h: 10 * 60 * 1000,               // 10min
  ts7d: 60 * 60 * 1000,                // 1h
};

const keySites = () => `sites:v6`;
const keyLatest = (hours) => `latest:v6:h${hours}`;
const keyTS = (metric, siteIds, hours) =>
  `ts:v6:${metric}:h${hours}:sites=${[...siteIds].sort().join(",")}`;

/** get cached wrapper; if stale or missing, fetcher() runs, cache set, and returned */
async function getWithCache(key, maxAgeMs, fetcher, meta) {
  try {
    const wrapped = await cacheGet(key);
    const fresh = wrapped && (Date.now() - (wrapped.savedAt || 0) <= maxAgeMs);
    if (fresh) return wrapped.data;

    const data = await fetcher();
    await cacheSet(key, data, meta);
    return data;
  } catch (e) {
    // On any cache error, fall back to fetcher
    const data = await fetcher();
    // Best-effort cache set
    try { await cacheSet(key, data, meta); } catch {}
    return data;
  }
}

/** fire-and-forget cache warmer (doesn't throw) */
async function warmCache(key, fetcher, meta) {
  try {
    const data = await fetcher();
    await cacheSet(key, data, meta);
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[cache warm failed]", key, e?.message || e);
  }
}

/* ----------------- Cached surfaces ------------------ */
async function cached_getSites() {
  const fetcher = () => (USE_MOCK ? mock_getSites() : live_getSites());
  return getWithCache(keySites(), TTL.sites, fetcher);
}

/** Fast path for SensorTable: return cached immediately if freshEnough, then (optionally) refresh */
async function cached_getLatestReadings({ hours = 24, freshMs = TTL.latest, refresh = true } = {}) {
  const key = keyLatest(hours);
  const fetcher = () => (USE_MOCK ? mock_getLatestReadings({ hours }) : live_getLatestReadings({ hours }));

  // Try cache first
  const wrapped = await cacheGet(key);
  const isFresh = wrapped && (Date.now() - (wrapped.savedAt || 0) <= freshMs);
  if (isFresh) {
    // Kick a silent refresh to keep cache hot
    if (refresh) warmCache(key, fetcher, { hours });
    return wrapped.data;
  }

  // Otherwise fetch now and cache
  const data = await fetcher();
  await cacheSet(key, data, { hours });
  return data;
}

/** Timeseries with cache; used by ComparePanel.reload() */
async function cached_getTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}) {
  const fetcher = () =>
    (USE_MOCK
      ? mock_getTimeseriesByMetric({ metric, siteIds, hours })
      : live_getTimeseriesByMetric({ metric, siteIds, hours }));

  const key = keyTS(metric, siteIds, hours);
  const ttl = hours <= 24 ? TTL.ts24h : TTL.ts7d;
  return getWithCache(key, ttl, fetcher, { metric, siteIds, hours });
}

/** Warm 7d for all sites of the metric in the background */
async function warm_7d_timeseries_for_metric(metric, allSites = []) {
  const hours = 24 * 7;
  // If no explicit siteIds, fetch from cache/sites endpoint
  let sites = allSites;
  if (!sites?.length) {
    sites = await cached_getSites();
  }
  const filtered = sites.filter((s) =>
    ["pm25","pm10","temperature","humidity","noise","illumination"].includes(metric)
      ? s.includes("-TH-")
      : s.includes("-VOC-")
  );

  // Build key and warm once for the combined set
  const key = keyTS(metric, filtered, hours);
  const fetcher = () =>
    (USE_MOCK
      ? mock_getTimeseriesByMetric({ metric, siteIds: filtered, hours })
      : live_getTimeseriesByMetric({ metric, siteIds: filtered, hours }));
  warmCache(key, fetcher, { metric, siteIds: filtered, hours });
}

/* ----------------- Public surface ------------------ */
export const api = USE_MOCK
  ? {
      // live-ish
      health: () => mock_health(),
      // cached variants
      getSites: () => cached_getSites(),
      getLatestReadings: (opts = {}) => cached_getLatestReadings(opts),
      getTimeseriesByMetric: (opts = {}) => cached_getTimeseriesByMetric(opts),

      // warmers
      warm7dForMetric: (metric, allSites) => warm_7d_timeseries_for_metric(metric, allSites),

      // direct (rarely needed by UI)
      _live: {
        queryTH: (p) => mock_queryTH(p),
        queryVOC: (p) => mock_queryVOC(p),
      },

      getMapDevices: () => MAP_DEVICES,
    }
  : {
      health: () => live_health(),

      // Cached entry points
      getSites: () => cached_getSites(),
      getLatestReadings: (opts = {}) => cached_getLatestReadings(opts),
      getTimeseriesByMetric: (opts = {}) => cached_getTimeseriesByMetric(opts),

      // Warmers
      warm7dForMetric: (metric, allSites) => warm_7d_timeseries_for_metric(metric, allSites),

      // (Optional) direct passthroughs if needed elsewhere
      _live: {
        queryTH: (p) => live_queryTH(p),
        queryVOC: (p) => live_queryVOC(p),
      },

      getMapDevices: () => MAP_DEVICES,
    };

export { MAP_DEVICES, MAP_SITES_V6 };
