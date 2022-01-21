const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "home", component: () => import("pages/Index.vue") }
    ]
  },
  {
    path: "/address/:address",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Address.vue") }]
  },
  {
    path: "/tx/:hash",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Transaction.vue") }]
  },
  {
    path: "/block/:block",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/Block.vue") }]
  },
  {
    path: "/transactions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "transactions",
        component: () => import("pages/Transactions.vue")
      }
    ]
  },
  {
    path: "/verify/:address?",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ 
      path: "",
      name: "verify", 
      component: () => import("pages/ContractVerification.vue") }]
  },
  {
    path: "*",
    component: () => import("pages/Error404.vue")
  }
];

export default routes;
