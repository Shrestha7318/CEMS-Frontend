<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold">Devices</h1>
    <SensorTable />
    <DevicesMap :devices="devices" />
  </section>
</template>

<script setup>
import SensorTable from '@/components/SensorTable.vue'
import { ref, onMounted } from "vue";
import DevicesMap from "@/components/DevicesMap.vue";
import { api } from "@/services/api"; 

const devices = ref([]);

onMounted(async () => {
  devices.value = await api.getSensors("");
});
</script>
