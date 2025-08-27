// src/services/api.js
import axios from 'axios'
import { sensors, currentReadings, genDeviceTimeseries } from '@/mocks/data'

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || ''
const USE_MOCK = String(
    import.meta.env.VITE_USE_MOCK).toLowerCase() !== 'false'
const http = axios.create({ baseURL: BASE_URL, timeout: 10000 })
const sleep = (ms = 300) => new Promise(r => setTimeout(r, ms))

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
            return q ?
                merged.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) :
                merged
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

    async getSensorTimeseries(id, { days = 2 } = {}) {
        if (USE_MOCK) {
            await sleep()
                // IMPORTANT: returns [{ ts: (ms), ...metrics }]
            return genDeviceTimeseries(id, days)
        }
        const { data } = await http.get(`/sensors/${id}/timeseries`, { params: { days } })
        return data
    }
}