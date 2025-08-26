import axios from 'axios'
import { sensors, currentReadings, genTimeseries, genTimeseries5m } from '@/mocks/data'

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK = String(
    import.meta.env.VITE_USE_MOCK).toLowerCase() !== 'false'

const http = axios.create({
    baseURL: BASE_URL,
    timeout: 10000
})

function sleep(ms = 400) {
    return new Promise(res => setTimeout(res, ms))
}

export const api = {
    async getSummary() {
        if (USE_MOCK) {
            await sleep()
            const online = currentReadings.filter(r => r.status !== 'offline').length
            const avgAQI = Math.round(currentReadings.reduce((a, b) => a + b.aqi, 0) / currentReadings.length)
            const alerts = currentReadings.filter(r => r.aqi > 100).length
            return { sensorCount: sensors.length, online, avgAQI, alerts }
        }
        const { data } = await http.get('/summary')
        return data
    },

    async getSensors(query = '') {
        if (USE_MOCK) {
            await sleep()
            const q = query.trim().toLowerCase()
            const merged = sensors.map(s => {
                const reading = currentReadings.find(r => r.id === s.id)
                return {...s, ...reading }
            })
            return q ? merged.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) : merged
        }
        const { data } = await http.get('/sensors', { params: { q: query } })
        return data
    },

    async getSensorById(id) {
        if (USE_MOCK) {
            await sleep()
            const s = sensors.find(s => s.id === id)
            const r = currentReadings.find(r => r.id === id)
            if (!s || !r) throw new Error('Not found')
            return {...s, ...r }
        }
        const { data } = await http.get(`/sensors/${id}`)
        return data
    },

    async getSensorTimeseries(id, { period = '2d', interval = '5m' } = {}) {
        if (USE_MOCK) {
            await sleep();
            // Strictly follow 2 days + 5 minutes as per spec
            if (period !== '2d') period = '2d';
            if (interval !== '5m') interval = '5m';
            return genTimeseries5m(48);
        }
        // back-end should implement these query params
        const { data } = await http.get(`/sensors/${id}/timeseries`, { params: { period, interval } });
        return data;
    }

}