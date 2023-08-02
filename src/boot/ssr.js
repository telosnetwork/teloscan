import { boot } from 'quasar/wrappers';

export default boot(async({ ssrContext }) => {
    if (!ssrContext)
        return;

    const env = require('../env.js');
    await import('localstorage-polyfill')
    Object.assign(process.env, env);
});
