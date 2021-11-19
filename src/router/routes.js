const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Index.vue") }]
  },
  {
    path: "/address/:address",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Address.vue") }]
  },
  {
    path: "/tx",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Transfer.vue") }]
  },{
    path: "/block",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Streaming.vue") }]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "*",
    component: () => import("pages/Error404.vue")
  }
];

export default routes;
