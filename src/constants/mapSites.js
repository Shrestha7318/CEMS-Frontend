// Canonical map devices (pins). Always use this for the map, regardless of API mode.
export const MAP_DEVICES = [
  // id = base id (UTIS####). Each base will have both TH and VOC sites: -TH-V6_1 / -VOC-V6_1
  { id: "UTIS0001", name: "Ingleside on the Bay",  lat: 27.8240, lon: -97.2130 },
  { id: "UTIS0002", name: "IOB Sandpiper",         lat: 27.8235, lon: -97.0660 },
  { id: "UTIS0003", name: "IOB Sunset",            lat: 27.8420, lon: -97.0930 },
  { id: "UTIS0004", name: "Gregory",               lat: 27.9220, lon: -97.2925 },
  { id: "UTIS0005", name: "Hillcrest",             lat: 27.8090, lon: -97.4070 },
  { id: "UTIS0006", name: "South Exxon-Sabic",     lat: 27.9000, lon: -97.3200 },
  { id: "UTIS0007", name: "North Exxon-Sabic",     lat: 27.9300, lon: -97.3200 },
  { id: "UTIS0008", name: "Port Aransas",          lat: 27.8339, lon: -97.0611 },
  { id: "UTIS0009", name: "Aransas Pass",          lat: 27.9095, lon: -97.1500 },
  { id: "UTIS0010", name: "Ingleside",             lat: 27.8800, lon: -97.2100 },
]

// Helper: expand a base into the two site names used by the V6 API
export const thSiteOf = (baseId) => `${baseId}-TH-V6_1`
export const vocSiteOf = (baseId) => `${baseId}-VOC-V6_1`

// The full list of API site names (20 entries = TH + VOC for each base)
export const MAP_SITES_V6 = MAP_DEVICES.flatMap(d => [thSiteOf(d.id), vocSiteOf(d.id)])
