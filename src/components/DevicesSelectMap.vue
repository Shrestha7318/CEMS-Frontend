<template>
  <l-map :zoom="zoom" :center="center" style="width: 100%; height: 100%;">
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"
    />

    <l-marker
      v-for="p in pins"
      :key="p.id + (p.id === selectedId ? '-sel' : '-def')"  
      :lat-lng="[p.lat, p.lon]"
      :icon="iconFor(p.id === selectedId)"
      @click="$emit('select', p.id)"
    />
  </l-map>
</template>

<script setup>
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

defineProps({
  center: { type: Array, default: () => [27.8800, -97.2100] },
  zoom:   { type: Number, default: 11 },
  pins:   { type: Array,  default: () => [] },
  selectedId: { type: String, default: null }
})
defineEmits(['select'])

/* SVG marker as a data URL (no external files = no broken image) */
const pinSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.6 12.5 28.5 12.5 28.5S25 22.1 25 12.5C25 5.6 19.4 0 12.5 0z"
        fill="${color}" stroke="#1f2937" />
  <circle cx="12.5" cy="12.5" r="4.5" fill="#fff" stroke="#111827"/>
</svg>`
const dataUrl = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const makeIcon = (color) =>
  L.icon({
    iconUrl: dataUrl(pinSvg(color)),
    iconRetinaUrl: dataUrl(pinSvg(color)),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],

  })

const EMERALD_600 = '#059669'
const iconFor = (selected) => makeIcon(selected ? EMERALD_600 : '#3b82f6')
</script>
