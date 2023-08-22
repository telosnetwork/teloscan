import { boot } from 'quasar/wrappers';
import env from 'src/env';

export default boot(async({ ssrContext }) => {
    if (!ssrContext) {
        return;
    }

    await import('localstorage-polyfill');
    await import('isomorphic-fetch');

    Object.assign(process.env, env);
});
