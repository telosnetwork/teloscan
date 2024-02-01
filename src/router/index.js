import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import routes from 'src/router/routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route((/* { store, ssrContext } */) => {
    const isServer = typeof window === 'undefined';
    const history = isServer ? createMemoryHistory(process.env.VUE_ROUTER_BASE) : createWebHistory(process.env.VUE_ROUTER_BASE);

    const Router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,

        // Leave this as is and make changes in quasar.conf.js instead!
        // quasar.conf.js -> build -> vueRouterMode
        // quasar.conf.js -> build -> publicPath
        history,
    });
    return Router;
});
