const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Index.vue") }]
  },
  {
    path: "/account/:accountName",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Account.vue") }]
  },
  {
    path: "/transfer",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Transfer.vue") }]
  },{
    path: "/streaming",
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
