
export const METRIC_OPTIONS = [
  // TH table
  { key: 'pm25',         label: 'PM2.5 (µg/m³)' },
  { key: 'pm10',         label: 'PM10 (µg/m³)' },
  { key: 'temperature',  label: 'Temperature (°F)' },
  { key: 'humidity',     label: 'Humidity (%)' },
  { key: 'noise',        label: 'Noise (dB)' },
  { key: 'illumination', label: 'Illumination (lx)' },

  // VOC table
  { key: 'voc',          label: 'VOC (ppm)' },
  { key: 'o3',           label: 'O₃ (ppm)' },
  { key: 'so2',          label: 'SO₂ (ppm)' },
  { key: 'no2',          label: 'NO₂ (ppm)' },

]

// Unit map to format numbers in cards/charts
export const METRIC_UNITS = {
  pm25: 'µg/m³', pm10: 'µg/m³', temperature: '°F', humidity: '%',
  noise: 'dB', illumination: 'lx', voc: 'ppm', o3: 'ppm', so2: 'ppm', no2: 'ppm'
}

export const labelForMetric = (k) =>
  METRIC_OPTIONS.find(o => o.key === k)?.label ?? k
