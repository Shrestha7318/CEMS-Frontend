// src/constants/metrics.js
export const METRIC_OPTIONS = [
  // TH table
  { key: 'pm25',         label: 'PM2.5 (µg/m³)' },
  { key: 'pm10',         label: 'PM10 (µg/m³)' },
  { key: 'temperature',  label: 'Temperature (°C)' },
  { key: 'humidity',     label: 'Humidity (%)' },
  { key: 'noise',        label: 'Noise (dB)' },
  { key: 'illumination', label: 'Illumination (lx)' },

  // VOC table
  { key: 'voc',          label: 'VOC' },
  { key: 'o3',           label: 'O₃' },
  { key: 'so2',          label: 'SO₂' },
  { key: 'no2',          label: 'NO₂' },

]

// Unit map to format numbers in cards/charts
export const METRIC_UNITS = {
  pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°C', humidity: '%',
  noise: 'dB', illumination: 'lx', voc: '', o3: '', so2: '', no2: ''
}

export const labelForMetric = (k) =>
  METRIC_OPTIONS.find(o => o.key === k)?.label ?? k
