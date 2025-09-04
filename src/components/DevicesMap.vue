<template>
  <div class="rounded-2xl border overflow-hidden">
    <l-map
      style="height: 400px; width: 100%;"
      :zoom="zoom"
      :center="center"
    >
      <!-- Free OpenStreetMap tiles -->
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"
      />
      
      <!-- Markers for devices -->
      <l-marker v-for="d in devices" :key="d.id" :lat-lng="[d.lat, d.lon]">
        <l-popup>
          <b>{{ d.name }}</b><br />
          AQI: {{ d.aqi }}<br />
          <router-link :to="`/devices/${d.id}`">Details →</router-link>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup>
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"

const props = defineProps({
  devices: { type: Array, default: () => [] },
  center: { type: Array, default: () => [27.8767, -97.3231] }, // fallback center
  zoom: { type: Number, default: 10 }
});
</script>
