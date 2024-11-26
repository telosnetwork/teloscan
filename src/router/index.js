import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory } from 'vue-router';
import routes from 'src/router/routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
    const createHistory = createWebHistory;

    const Router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,

        // Leave this as is and make changes in quasar.conf.js instead!
        // quasar.conf.js -> build -> vueRouterMode
        // quasar.conf.js -> build -> publicPath
        history: createHistory(process.env.VUE_ROUTER_BASE),
    });

    // Add a global navigation guard to detect changes in route.query.network
    Router.beforeEach((to, from, next) => {
        const networkChanged = to.query.network !== from.query.network;
        if (networkChanged) {
            // Get the deepest matched route record
            const matchedRoute = to.matched[to.matched.length - 1];
            if (matchedRoute && matchedRoute.meta && matchedRoute.meta.networkChange) {
                // If the route has a 'networkChange' label, redirect to that label
                // only if the network if different from the current one page name
                if (matchedRoute.meta.networkChange !== from.name) {
                    // If the network change is to 'home', redirect to the home page
                    next({ name: matchedRoute.meta.networkChange });
                } else {
                    // Otherwise, proceed to the intended route
                    next();
                }
            } else {
                // Otherwise, proceed to the intended route
                next();
            }
        } else {
            // If network has not changed, proceed as normal
            next();
        }
    });

    return Router;
});
