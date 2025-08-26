import { createRouter, createWebHistory } from "vue-router";

const Dashboard = () =>
    import ("@/pages/Dashboard.vue");
const Devices = () =>
    import ("@/pages/Devices.vue");
const DeviceDetails = () =>
    import ("@/pages/DeviceDetails.vue");
const NotFound = () =>
    import ("@/pages/NotFound.vue");

const routes = [
    { path: "/", name: "Dashboard", component: Dashboard },
    { path: "/devices", name: "Devices", component: Devices },
    {
        path: "/devices/:id",
        name: "DeviceDetails",
        component: DeviceDetails,
        props: true,
    },
    { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});