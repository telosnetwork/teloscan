const routes = [
    {
        path: '',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'home',
                component: () => import('pages/Index.vue'),
            },
        ],
    },
    {
        path: '/address/:address',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            { path: '',
                name: 'address',
                component: () => import('pages/AccountAddress.vue') },
        ],
    },
    {
        path: '/tx/:hash',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/Transaction.vue') }],
    },
    {
        path: '/block/:block',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/Block.vue') }],
    },
    {
        path: '/transactions',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'transactions',
                component: () => import('pages/Transactions.vue'),
            },
        ],
    },
    {
        path: '/contract',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: 'verify/:address?',
                name: 'verify',
                component: () => import('pages/ContractVerification.vue'),
            },
        ],
    },
    {
        path: '/endpoints',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/Endpoints.vue') }],
    },
    {
        name: 'sourcify',
        path: '',
        beforeEnter() {
            window.open('https://sourcify.dev', '_blank')
        },
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/Error404.vue'),
    },
];

export default routes;
