import { createRouter, createWebHistory } from "vue-router";

const HomePage = () =>
    import ("@/pages/HomePage.vue");
const Dashboard = () =>
    import ("@/pages/Dashboard.vue");
// const Devices = () =>
//     import ("@/pages/Devices.vue");
// const DeviceDetails = () =>
//     import ("@/pages/DeviceDetails.vue");
const DeviceUnified = () =>
    import ("@/pages/DeviceUnified.vue");
const NotFound = () =>
    import ("@/pages/NotFound.vue");
const Team = () =>
    import ("@/pages/Team.vue");

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: "/dashboard", name: "Dashboard", component: Dashboard },
    { path: '/devices', name: 'devices', component: DeviceUnified },
    { path: '/Team', name: 'Team', component: Team },
    // { path: "/devices", name: "Devices", component: Devices },
    // {
    //     path: "/devices/:id",
    //     name: "DeviceDetails",
    //     component: DeviceDetails,
    //     props: true,
    // },
    { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});