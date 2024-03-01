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
        path: '/address/:address/sourcify',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'sourcify',
                component: () => import('pages/ContractVerification.vue'),
            },
        ],
    },
    {
        path: '/address/:address',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'address',
                props: route => ({ page: route.query.page, pagesize: route.query.pagesize }),
                component: () => import('pages/AccountAddress.vue'),
            },
        ],
    },
    {
        path: '/tx/:hash',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'transaction',
            component: () => import('pages/TransactionPage.vue'),
        }],
    },
    {
        path: '/txs',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'transactions',
                component: () => import('pages/TransactionsPage.vue'),
            },
        ],
    },
    {
        path: '/block/:block',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'block',
            component: () => import('pages/BlockPage.vue'),
        }],
    },
    {
        path: '/holders',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'holders',
                component: () => import('pages/Holders.vue'),
            },
        ],
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('pages/demo/DemoIndexPage.vue'),
        children: [{
            path: 'inputs',
            name: 'inputs-demo',
            component: () => import('pages/demo/inputs/InputsDemo.vue'),
        }],
    },
    {
        path: '/health',
        name: 'health',
        component: () => import('layouts/MainLayout.vue'),
        children: [{ path: '', component: () => import('pages/HealthPage.vue') }],
    },
    {
        path: '/endpoints',
        // eslint-disable-next-line no-unused-vars
        redirect: () => ({ path: '/health' }),
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/Error404.vue'),
    },
];

export default routes;
