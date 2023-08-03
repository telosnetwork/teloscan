import { boot } from 'quasar/wrappers';

export default boot(async({ ssrContext }) => {
    if (!ssrContext)
        return;

    await import('localstorage-polyfill')
    await import('isomorphic-fetch')

    const env = require('../env.js');
    Object.assign(process.env, env);
});
