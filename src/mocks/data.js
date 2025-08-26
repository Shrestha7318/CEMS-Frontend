// Simple seeded random for consistent demo
function seedRand(seed = 42) {
    let t = seed
    return () => (t = (t * 1664525 + 1013904223) % 4294967296) / 4294967296
}
const rand = seedRand(123)

function randomIn(min, max) {
    return Math.round((min + (max - min) * rand()) * 10) / 10
}

export const sensors = [
    { id: 'S-001', name: 'Downtown Station', lat: 32.7767, lon: -96.7970, status: 'online' },
    { id: 'S-002', name: 'Uptown Station', lat: 32.8140, lon: -96.9489, status: 'online' },
    { id: 'S-003', name: 'Riverside Station', lat: 32.7555, lon: -97.3308, status: 'online' },
    { id: 'S-004', name: 'Industrial Park', lat: 32.9098, lon: -96.8353, status: 'warning' },
    { id: 'S-005', name: 'Airport Station', lat: 32.8998, lon: -97.0403, status: 'offline' },
    { id: 'S-006', name: 'Suburb North', lat: 33.0198, lon: -96.6989, status: 'online' },
    { id: 'S-007', name: 'Suburb South', lat: 32.6400, lon: -96.9100, status: 'online' },
    { id: 'S-008', name: 'Lakeside Station', lat: 32.9884, lon: -96.9078, status: 'online' }
]

// Add current readings
export const currentReadings = sensors.map((s) => ({
    id: s.id,
    aqi: Math.round(randomIn(30, 150)),
    pm25: randomIn(5, 85),
    pm10: randomIn(10, 140),
    co2: Math.round(randomIn(420, 1200)),
    temp: randomIn(15, 38),
    humidity: randomIn(20, 85),
    lastSeen: new Date(Date.now() - Math.round(rand() * 3600 * 1000)).toISOString(),
    status: s.status
}))

export function genTimeseries(hours = 24) {
    const now = Date.now()
    const series = []
    let aqi = currentReadings[0].aqi
    for (let i = hours; i >= 0; i--) {
        aqi = Math.max(0, Math.min(200, aqi + randomIn(-8, 8)))
        series.push({
            ts: new Date(now - i * 60 * 60 * 1000).toISOString(),
            aqi,
            pm25: Math.max(0, randomIn(5, 90)),
            pm10: Math.max(0, randomIn(10, 160)),
            co2: Math.max(350, Math.round(randomIn(420, 1200))),
            temp: randomIn(14, 40),
            humidity: randomIn(15, 90),
        })
    }

    return series
}

export function genTimeseries5m(hours = 48) {
    const points = (hours * 60) / 5; // 5-min steps
    const now = Date.now();
    const series = [];

    // start near the first device's current values so the chart looks realistic
    const seed = currentReadings[0] || { aqi: 70, pm25: 25, pm10: 40, co2: 600, temp: 25, humidity: 50 };

    let aqi = seed.aqi;
    let pm25 = seed.pm25;
    let pm10 = seed.pm10;
    let co2 = seed.co2;
    let temp = seed.temp;
    let hum = seed.humidity;

    function jitter(v, mag) { return v + (Math.random() - 0.5) * mag; }

    for (let i = points; i >= 0; i--) {
        const ts = new Date(now - i * 5 * 60 * 1000).toISOString();

        aqi = Math.max(0, Math.min(200, jitter(aqi, 2.5)));
        pm25 = Math.max(0, jitter(pm25, 1.2));
        pm10 = Math.max(0, jitter(pm10, 1.8));
        co2 = Math.max(350, Math.round(jitter(co2, 8)));
        temp = Math.max(-10, jitter(temp, 0.2));
        hum = Math.max(0, Math.min(100, jitter(hum, 0.6)));

        series.push({ ts, aqi: Math.round(aqi), pm25: +pm25.toFixed(1), pm10: +pm10.toFixed(1), co2, temp: +temp.toFixed(1), humidity: +hum.toFixed(1) });
    }
    return series;
}