const routes = [
    {
        path: '',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'home',
            component: () => import('pages/home/HomePage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/token/:address',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'token',
                props: route => ({ page: route.query.page, pagesize: route.query.pagesize }),
                component: () => import('pages/AccountPage.vue'),
                meta: { networkChange: null },
            },
        ],
    },
    {
        path: '/address/:address/sourcify',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'sourcify',
            component: () => import('pages/ContractVerification.vue'),
            meta: { networkChange: 'home' },
        }],
    },
    {
        path: '/address/:address',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'address',
                props: route => ({ page: route.query.page, pagesize: route.query.pagesize }),
                component: () => import('pages/AccountPage.vue'),
                meta: { networkChange: 'address' },
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
            meta: { networkChange: 'home' },
        }],
    },
    {
        path: '/txs',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'transactions',
            component: () => import('pages/TransactionsPage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/block/:block',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'block',
            component: () => import('pages/BlockPage.vue'),
            meta: { networkChange: 'home' },
        }],
    },
    {
        path: '/blocks',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'blocks',
            component: () => import('pages/BlockListPage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/holders',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'holders',
            component: () => import('pages/Holders.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('pages/demo/DemoIndexPage.vue'),
        children: [{
            path: 'inputs',
            name: 'inputs-demo',
            component: () => import('pages/demo/inputs/InputsDemo.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/health',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'health',
            component: () => import('pages/HealthPage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/endpoints',
        redirect: () => ({ path: '/health' }),
    },
    {
        path: '/export',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'export',
            component: () => import('pages/export/ExportPage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/txsinternal',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            name: 'txsinternal',
            component: () => import('pages/InternalTrxPage.vue'),
            meta: { networkChange: null },
        }],
    },
    {
        path: '/staking',
        beforeEnter() {
            window.location.href = 'https://wallet.telos.net/evm/staking?tab=stake';
        },
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('layouts/MainLayout.vue'),
        children: [{
            path: '',
            component: () => import('pages/ErrorNotFoundPage.vue'),
            meta: { networkChange: null },
        }],
    },
];

export default routes;
