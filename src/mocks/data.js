// src/mocks/data.js
// Fresh mock generator with correct timestamps (ms), 5-min interval, last N days.

// ---------- utilities ----------
function seedRand(seed = 1234567) {
    // Deterministic PRNG (xorshift32)
    let x = seed >>> 0;
    return () => {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        // 0..1
        return ((x >>> 0) / 4294967296);
    };
}

function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0);
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ---------- sensor catalog ----------
export const sensors = [
    { id: 'S-001', name: 'Downtown Station', lat: 32.7767, lon: -96.7970, status: 'online' },
    { id: 'S-002', name: 'Uptown Station', lat: 32.8140, lon: -96.9489, status: 'online' },
    { id: 'S-003', name: 'Riverside Station', lat: 32.7555, lon: -97.3308, status: 'online' },
    { id: 'S-004', name: 'Industrial Park', lat: 32.9098, lon: -96.8353, status: 'warning' },
    { id: 'S-005', name: 'Airport Station', lat: 32.8998, lon: -97.0403, status: 'offline' },
    { id: 'S-006', name: 'Suburb North', lat: 33.0198, lon: -96.6989, status: 'online' },
    { id: 'S-007', name: 'Suburb South', lat: 32.6400, lon: -96.9100, status: 'online' },
    { id: 'S-008', name: 'Lakeside Station', lat: 32.9884, lon: -96.9078, status: 'online' },
];

// ---------- timeseries generators ----------
/**
 * Generate a per-device timeseries at 5-minute intervals for the last `days` days.
 * Returns an array of points:
 *   [{ ts: <number ms>, aqi, pm25, pm10, co2, temp, humidity }, ...]
 */
export function genDeviceTimeseries(id, days = 2) {
    const rnd = seedRand(hashString(String(id)) || 42);
    const now = Date.now(); // ms
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    const start = now - days * 24 * 60 * 60 * 1000;

    // Device-specific baselines
    let aqi = 40 + rnd() * 40; // 40..80
    let pm25 = 8 + rnd() * 25;
    let pm10 = 15 + rnd() * 45;
    let co2 = 420 + rnd() * 300; // ppm
    let temp = 18 + rnd() * 12; // °C
    let hum = 35 + rnd() * 40; // %

    const out = [];
    for (let t = start; t <= now; t += intervalMs) {
        // gentle random walk per step
        aqi = clamp(aqi + (rnd() - 0.5) * 3.0, 0, 200);
        pm25 = clamp(pm25 + (rnd() - 0.5) * 1.2, 0, 500);
        pm10 = clamp(pm10 + (rnd() - 0.5) * 1.8, 0, 600);
        co2 = Math.max(380, Math.round(co2 + (rnd() - 0.5) * 10));
        temp = clamp(temp + (rnd() - 0.5) * 0.25, -20, 55);
        hum = clamp(hum + (rnd() - 0.5) * 0.8, 0, 100);

        out.push({
            ts: t, // number (ms since epoch)
            aqi: Math.round(aqi),
            pm25: +pm25.toFixed(1),
            pm10: +pm10.toFixed(1),
            co2,
            temp: +temp.toFixed(1),
            humidity: +hum.toFixed(1),
        });
    }
    return out;
}

/**
 * Convenience: generate a shared series (not device-specific), last `hours` hours at 5-min.
 * Kept for dashboards that don’t target a specific device.
 */
export function genTimeseries5m(hours = 48, seed = 1234) {
    const rnd = seedRand(seed);
    const now = Date.now();
    const start = now - hours * 60 * 60 * 1000;
    const intervalMs = 5 * 60 * 1000;

    let aqi = 55 + rnd() * 20;
    let pm25 = 15 + rnd() * 15;
    let pm10 = 25 + rnd() * 25;
    let co2 = 500 + rnd() * 250;
    let temp = 22 + rnd() * 6;
    let hum = 45 + rnd() * 20;

    const out = [];
    for (let t = start; t <= now; t += intervalMs) {
        aqi = clamp(aqi + (rnd() - 0.5) * 3.0, 0, 200);
        pm25 = clamp(pm25 + (rnd() - 0.5) * 1.2, 0, 500);
        pm10 = clamp(pm10 + (rnd() - 0.5) * 1.8, 0, 600);
        co2 = Math.max(380, Math.round(co2 + (rnd() - 0.5) * 10));
        temp = clamp(temp + (rnd() - 0.5) * 0.25, -20, 55);
        hum = clamp(hum + (rnd() - 0.5) * 0.8, 0, 100);

        out.push({
            ts: t,
            aqi: Math.round(aqi),
            pm25: +pm25.toFixed(1),
            pm10: +pm10.toFixed(1),
            co2,
            temp: +temp.toFixed(1),
            humidity: +hum.toFixed(1),
        });
    }
    return out;
}

// ---------- "current readings" snapshot (from end of each device series) ----------
/**
 * Returns [{ id, aqi, pm25, pm10, co2, temp, humidity, lastSeen, status }]
 * lastSeen is ISO string for display; numeric timestamps are still used in charts.
 */
export const currentReadings = sensors.map((s) => {
    const series = genDeviceTimeseries(s.id, 2); // 2 days by default
    const latest = series[series.length - 1];
    return {
        id: s.id,
        aqi: latest.aqi,
        pm25: latest.pm25,
        pm10: latest.pm10,
        co2: latest.co2,
        temp: latest.temp,
        humidity: latest.humidity,
        lastSeen: new Date(latest.ts).toISOString(),
        status: s.status,
    };
});