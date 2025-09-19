import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/assets/main.css'
import "./leaflet-icons";
import { preloadDevicesPage } from '@/preload/devicesWarmup'


createApp(App).use(router).mount('#app')
// Fire-and-forget: start warming the Devices page cache
// - delay a tick so the UI paints first
queueMicrotask(() => {
  // If you want to wait until the browser is idle:
  const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
  ric(() => {
    preloadDevicesPage({
      count: 6,        // preload first 6 devices
      concurrency: 2,  // 2 parallel device warms (keeps network modest)
    })
  })
})