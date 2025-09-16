<template>
  <div class="rounded-2xl border overflow-hidden">
    <l-map style="height: 400px; width: 100%;" :zoom="zoom" :center="center">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"
      />
      <l-marker v-for="p in pins" :key="p.id" :lat-lng="[p.lat, p.lon]">
        <l-popup>
          <div class="space-y-2">
            <div class="font-semibold">{{ p.name }}</div>
           
            <router-link
              :to="{ name: 'devices', query: { id: p.id } }"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl
                     border border-gray-300 dark:border-gray-700
                     bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800
                     text-xs">
              Open → 
            </router-link>
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup>
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"
import { MAP_DEVICES as pins } from "@/constants/mapSites"

defineProps({
  center: { type: Array, default: () => [27.8800, -97.2100] },
  zoom:   { type: Number, default: 11 }
})
</script>
