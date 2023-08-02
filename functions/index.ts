let onRequest;
if (process?.env?.PROD) {
    // @ts-ignore
    // eslint-disable-next-line no-restricted-imports
    import r from '../ssr/index.js';
    onRequest = r;
} else {
    console.log('NOT PROD');
}

export {};
module.exports = onRequest;
