// src/constants/mapSites.js

// Helper: expand a base into the two site names used by the V6 API
export const thSiteOf  = (baseId) => `${baseId}-TH-V6_1`
export const vocSiteOf = (baseId) => `${baseId}-VOC-V6_1`

// Canonical map devices (pins). Always use this for the map, regardless of API mode.
// Each pin now declares exactly which TH/VOC device IDs it corresponds to.
export const MAP_DEVICES = [
  { id: "UTIS0001", name: "Ingleside on the Bay",  lat: 27.8240, lon: -97.2130,
    sites: { th: thSiteOf("UTIS0001"), voc: vocSiteOf("UTIS0001") } },
  { id: "UTIS0002", name: "IOB Sandpiper",         lat: 27.8235, lon: -97.0660,
    sites: { th: thSiteOf("UTIS0002"), voc: vocSiteOf("UTIS0002") } },
  { id: "UTIS0003", name: "IOB Sunset",            lat: 27.8420, lon: -97.0930,
    sites: { th: thSiteOf("UTIS0003"), voc: vocSiteOf("UTIS0003") } },
  { id: "UTIS0004", name: "Gregory",               lat: 27.9220, lon: -97.2925,
    sites: { th: thSiteOf("UTIS0004"), voc: vocSiteOf("UTIS0004") } },
  { id: "UTIS0005", name: "Hillcrest",             lat: 27.8090, lon: -97.4070,
    sites: { th: thSiteOf("UTIS0005"), voc: vocSiteOf("UTIS0005") } },
  { id: "UTIS0006", name: "South Exxon-Sabic",     lat: 27.9000, lon: -97.3200,
    sites: { th: thSiteOf("UTIS0006"), voc: vocSiteOf("UTIS0006") } },
  { id: "UTIS0007", name: "North Exxon-Sabic",     lat: 27.9300, lon: -97.3200,
    sites: { th: thSiteOf("UTIS0007"), voc: vocSiteOf("UTIS0007") } },
  { id: "UTIS0008", name: "Port Aransas",          lat: 27.8339, lon: -97.0611,
    sites: { th: thSiteOf("UTIS0008"), voc: vocSiteOf("UTIS0008") } },
  { id: "UTIS0009", name: "Aransas Pass",          lat: 27.9095, lon: -97.1500,
    sites: { th: thSiteOf("UTIS0009"), voc: vocSiteOf("UTIS0009") } },
  { id: "UTIS0011", name: "Ingleside",             lat: 27.8800, lon: -97.2100,
    sites: { th: thSiteOf("UTIS0010"), voc: vocSiteOf("UTIS0010") } },
]

// The full list of API site names (20 entries = TH + VOC for each base)
export const MAP_SITES_V6 = MAP_DEVICES.flatMap(d => [d.sites.th, d.sites.voc])
