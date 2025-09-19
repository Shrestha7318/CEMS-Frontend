// ──────────────────────────────────────────────────────────────────────────────
// Mock generator v2 — realistic signals + SensorTable-safe shapes
// - Keeps the same exports & field names your API normalizers expect
// - Adds diurnals, weather-ish correlations, occasional gaps & spikes
// - Adds small Reported→Received delay jitter
// ──────────────────────────────────────────────────────────────────────────────

/* ---------------- Map catalog (unchanged) ---------------- */
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
];

export const thSiteOf  = (baseId) => `${baseId}-TH-V6_1`;
export const vocSiteOf = (baseId) => `${baseId}-VOC-V6_1`;
export const MAP_SITES_V6 = MAP_DEVICES.flatMap(d => [thSiteOf(d.id), vocSiteOf(d.id)]);

/* ---------------- Small time helpers (UTC SQL strings) ---------------- */
function pad(n){ return String(n).padStart(2,"0"); }
function toUtcSql(d){
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth()+1)}-${pad(dt.getUTCDate())} ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`;
}
function parseUtcSql(s){
  if (!s || typeof s !== "string") return NaN;
  const [d,t] = s.trim().split(/[ T]/);
  if (!d || !t) return NaN;
  const [Y,M,D] = d.split("-").map(Number);
  const [h,m,secRaw] = t.split(":");
  const [sInt] = String(secRaw ?? "0").split(".");
  return Date.UTC(Y,(M||1)-1,D||1,Number(h)||0,Number(m)||0,Number(sInt)||0);
}
function lastHours(hours=24,end=Date.now()){
  const endDate = new Date(end);
  const startDate = new Date(end - hours*3600*1000);
  return [toUtcSql(startDate), toUtcSql(endDate)];
}

/* ---------------- Deterministic PRNG ---------------- */
function seedRand(seed=1234567){
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x>>>0)/4294967296;
  };
}
function hashString(s){
  let h = 2166136261>>>0;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
    h >>>= 0;
  }
  return h>>>0;
}
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const lerp = (a,b,t)=>a+(b-a)*t;

function* iter5m(startMs,endMs){ for(let t=startMs;t<=endMs;t+=5*60*1000) yield t; }

function rangeFromParams(params={}){
  let {start_time,end_time} = params;
  if(!start_time || !end_time){ [start_time,end_time] = lastHours(24); }
  const startMs = parseUtcSql(start_time);
  const endMs   = parseUtcSql(end_time);
  return { start_time, end_time, startMs, endMs };
}

/* ---------------- Public: sites list ---------------- */
export function genSites(){ return MAP_SITES_V6.slice(); }

/* ---------------- Helpers for realism ---------------- */
// Diurnal in [0..1], peak around 14:00 UTC-ish (doesn't apply TZ; simple, repeatable)
function diurnal01(ms, phase=0){
  const h = new Date(ms).getUTCHours() + phase; // add per-site phase
  const ang = ((h%24)/24)*2*Math.PI;
  // daylight-like bump: clamp(sin)^1.5 to keep nights near zero
  const s = Math.sin(ang - Math.PI/2); // peak at ~12:00
  return s > 0 ? Math.pow(s,1.5) : 0;
}

// Random spike generator: returns a multiplier ~1 with occasional big excursions
function spiky(rnd, {p=0.003, maxMult=6, mild=2}={}){
  const u = rnd();
  if (u < p) return lerp(mild, maxMult, rnd()); // rare big spikes
  if (u < p*10) return lerp(1, mild, rnd());     // more common mild bumps
  return 1 + (rnd()-0.5)*0.05; // small jitter
}

// Bernoulli keep? for gaps/dropouts
function keepSample(rnd, pKeep=0.97){ return rnd() < pKeep; }

// ReceivedTime jitter (0–90s after reported)
function receivedFromReported(ms, rnd){
  const lag = Math.floor(rnd()*90_000);
  return new Date(ms + lag);
}

// stringify with fixed decimals (API sends strings; your normalizer handles them)
const fx = (v, k)=> {
  if (k === "VOC" || k === "O3" || k === "SO2" || k === "NO2") return v.toFixed(4);
  if (k === "PM2_5" || k === "PM10") return v.toFixed(2);
  if (k === "Temperature" || k === "Humidity" || k === "Noise" || k === "Illumination") return v.toFixed(2);
  return String(v);
};

/* ---------------- TH rows (5-minute cadence) ---------------- */
/* ---------------- TH rows (5-minute cadence) — PM kept like OLD generator ---------------- */
export async function genTHRows(params = {}) {
  const { startMs, endMs } = rangeFromParams(params);
  const all = params.site_name ? [params.site_name] : genSites();
  const thSites = all.filter(s => s.includes("-TH-"));

  const out = [];
  for (const site of thSites) {
    const baseSeed = hashString(site);
    const rnd = seedRand(baseSeed);

    // Site baselines (slightly different per site) — unchanged
    const tBase    = lerp(18, 28,  (baseSeed % 100) / 100);          // °C
    const hBase    = lerp(45, 75, ((baseSeed >> 8)  % 100) / 100);   // %
    const noiseBase= lerp(40, 55, ((baseSeed >> 24) % 100) / 100);   // dBA
    const illumMax = lerp(800, 1400, ((baseSeed >> 12) % 100) / 100);

    // --- PM initialization kept from OLD generator ---
    let pm25 = 8  + rnd() * 25;  // µg/m³
    let pm10 = 15 + rnd() * 45;  // µg/m³

    for (const tsMs of iter5m(startMs, endMs)) {
      if (!keepSample(rnd, 0.985)) continue; // small gaps

      const d = diurnal01(tsMs, (baseSeed % 6) * 0.5); // per-site phase

      // Temperature/Humidity/Illumination/Noise — keep v2 behavior
      const temp = clamp(tBase + d * 6 + (rnd() - 0.5) * 0.8, -20, 55);
      const rh   = clamp(hBase + (1 - d) * 10 + (rnd() - 0.5) * 4, 5, 100);
      const illum= clamp(d * illumMax + Math.max(0, (rnd() - 0.5)) * 120, 0, 2000);
      const noise= clamp(noiseBase + d * 6 + (rnd() - 0.5) * 2.5, 25, 90);

      // --- PM updates kept from OLD generator (pure random walk; no diurnal/spike coupling) ---
      pm25 = clamp(pm25 + (rnd() - 0.5) * 1.30, 0, 500);
      pm10 = clamp(pm10 + (rnd() - 0.5) * 1.80, 0, 600);

      const reported = new Date(tsMs);
      const received = receivedFromReported(tsMs, rnd);

      out.push({
        SiteName:        site,
        Temperature:     fx(temp,  "Temperature"),
        Humidity:        fx(rh,    "Humidity"),
        Illumination:    fx(illum, "Illumination"),
        Noise:           fx(noise, "Noise"),
        PM2_5:           fx(pm25,  "PM2_5"),   // unchanged style/precision
        PM10:            fx(pm10,  "PM10"),    // unchanged style/precision
        ReportedTimeUTC: toUtcSql(reported),
        ReceivedTime:    toUtcSql(received),
      });
    }
  }
  return out;
}


/* ---------------- VOC rows (5-minute cadence) ---------------- */
export async function genVOCRows(params={}){
  const { startMs, endMs } = rangeFromParams(params);
  const all = params.site_name ? [params.site_name] : genSites();
  const vocSites = all.filter(s => s.includes("-VOC-"));

  const out = [];
  for (const site of vocSites){
    const baseSeed = hashString(site) ^ 0x9e3779b9;
    const rnd = seedRand(baseSeed);

    // Baselines roughly aligned with your sample (ppm), with zeros allowed
    let vocBase = lerp(0.08, 0.20,  (baseSeed % 100)/100);
    let o3Base  = lerp(0.008,0.040, ((baseSeed>>8)%100)/100);
    let so2Base = lerp(0.010,0.060, ((baseSeed>>16)%100)/100);
    let no2Base = lerp(0.008,0.025, ((baseSeed>>24)%100)/100);

    for (const tsMs of iter5m(startMs, endMs)){
      if (!keepSample(rnd, 0.985)) continue; // occasional dropouts

      const d = diurnal01(tsMs, (baseSeed%6)*0.5);

      // O3 tends to rise mid-day; VOC tends to morning/evening
      const vocDiurnal = 0.6 + 0.8*Math.max(0.2, (1 - Math.abs(d-0.5)*2)); // two bumps
      const o3Diurnal  = 0.7 + 1.2*d;
      const no2Diurnal = 0.9 + 0.6*(1-d); // a bit higher at night/commute
      const so2Diurnal = 0.9 + 0.4*(rnd()); // weak diurnal

      // Spikes & zeros (as seen in your sample)
      const vocSpike = spiky(rnd, { p: 0.006, maxMult: 4.5, mild: 2.0 });
      const so2Spike = spiky(rnd, { p: 0.003, maxMult: 5.0, mild: 1.8 });
      const no2Spike = spiky(rnd, { p: 0.0035, maxMult: 10.0, mild: 2.5 }); // rare big NO2
      const o3Spike  = spiky(rnd, { p: 0.002, maxMult: 3.0, mild: 1.5 });

      // occasional hard zero readings (instrument quirk)
      const makeZero = (p) => (rnd() < p ? 0 : 1);

      let voc = clamp(vocBase * vocDiurnal * vocSpike * makeZero(0.02) + (rnd()-0.5)*0.01, 0, 5);
      let o3  = clamp(o3Base  * o3Diurnal  * o3Spike  * makeZero(0.01) + (rnd()-0.5)*0.003, 0, 1);
      let so2 = clamp(so2Base * so2Diurnal * so2Spike * makeZero(0.01) + (rnd()-0.5)*0.004, 0, 2.5);
      let no2 = clamp(no2Base * no2Diurnal * no2Spike * makeZero(0.015)+ (rnd()-0.5)*0.006, 0, 1.5);

      // Snap a few extreme pops to illustrate outliers (rare)
      if (rnd() < 0.0008) no2 = clamp(no2 * (8 + rnd()*4), 0, 1.5);
      if (rnd() < 0.0008) so2 = clamp(so2 * (8 + rnd()*4), 0, 2.5);

      const reported = new Date(tsMs);
      const received = receivedFromReported(tsMs, rnd);

      out.push({
        SiteName:        site,
        ReportedTimeUTC: toUtcSql(reported),
        ReceivedTime:    toUtcSql(received),
        VOC:             fx(voc, "VOC"),
        O3:              fx(o3,  "O3"),
        SO2:             fx(so2, "SO2"),
        NO2:             fx(no2, "NO2"),
      });
    }
  }
  return out;
}

/* ---------------- Latest-per-site (unchanged signature) ---------------- */
/* ---------------- Latest-per-site (unchanged signature) ---------------- */
export function pickLatestBySite(allSites, thRows, vocRows){
  const latest = {};
  const thBy = new Map();
  const vocBy = new Map();

  for (const r of thRows){
    const prev = thBy.get(r.SiteName);
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) thBy.set(r.SiteName, r);
  }
  for (const r of vocRows){
    const prev = vocBy.get(r.SiteName);
    if (!prev || parseUtcSql(r.ReportedTimeUTC) > parseUtcSql(prev.ReportedTimeUTC)) vocBy.set(r.SiteName, r);
  }

  for (const site of allSites){
    const rTH  = thBy.get(site);
    const rVOC = vocBy.get(site);

    if (site.includes("-TH-")){
      if (!rTH){ latest[site] = null; continue; }
      const t  = Number(rTH.Temperature);
      const h  = Number(rTH.Humidity);
      latest[site] = {
        site,
        // particulates & env
        pm25: Number(rTH.PM2_5),
        pm10: Number(rTH.PM10),
        temperature: t,            // original normalized key
        tempC: t,                  // ✅ alias for SensorTable
        humidity: h,               // original normalized key
        rh: h,                     // ✅ alias for SensorTable
        noise: Number(rTH.Noise),
        illumination: Number(rTH.Illumination),

        // times
        reportedUTC: rTH.ReportedTimeUTC,
        receivedUTC: rTH.ReceivedTime,
        ts: parseUtcSql(rTH.ReportedTimeUTC),
        lastSeenMs: parseUtcSql(rTH.ReportedTimeUTC),
      };
    } else {
      if (!rVOC){ latest[site] = null; continue; }
      latest[site] = {
        site,
        voc: Number(rVOC.VOC),
        o3: Number(rVOC.O3),
        so2: Number(rVOC.SO2),
        no2: Number(rVOC.NO2),

        reportedUTC: rVOC.ReportedTimeUTC,
        receivedUTC: rVOC.ReceivedTime,
        ts: parseUtcSql(rVOC.ReportedTimeUTC),
        lastSeenMs: parseUtcSql(rVOC.ReportedTimeUTC),
      };
    }
  }
  return latest;
}


/* ---------------- Timeseries by metric (CompareChart) ---------------- */
export async function genTimeseriesByMetric({ metric, siteIds = [], hours = 24 } = {}){
  const [start_time, end_time] = lastHours(hours);
  const TH_KEYS = ["pm25","pm10","temperature","humidity","noise","illumination"];
  const isTH = TH_KEYS.includes(metric);

  const targets = siteIds.length
    ? siteIds
    : genSites().filter(s => isTH ? s.includes("-TH-") : s.includes("-VOC-"));

  // Generate rows for all sites in range, then select
  const rows = isTH
    ? await genTHRows({ start_time, end_time })
    : await genVOCRows({ start_time, end_time });

  const bySite = new Map(targets.map(s => [s, []]));
  for (const r of rows){
    const site = r.SiteName;
    if (!bySite.has(site)) continue;
    const ts = parseUtcSql(r.ReportedTimeUTC);
    let val;
    if (isTH){
      switch (metric){
        case "pm25":         val = Number(r.PM2_5); break;
        case "pm10":         val = Number(r.PM10); break;
        case "temperature":  val = Number(r.Temperature); break;
        case "humidity":     val = Number(r.Humidity); break;
        case "noise":        val = Number(r.Noise); break;
        case "illumination": val = Number(r.Illumination); break;
      }
    } else {
      switch (metric){
        case "voc": val = Number(r.VOC); break;
        case "o3":  val = Number(r.O3);  break;
        case "so2": val = Number(r.SO2); break;
        case "no2": val = Number(r.NO2); break;
      }
    }
    if (Number.isFinite(ts) && Number.isFinite(val)) bySite.get(site).push({ ts, value: val });
  }

  const out = {};
  for (const [site, arr] of bySite) out[site] = arr.sort((a,b)=>a.ts-b.ts);
  return out;
}
