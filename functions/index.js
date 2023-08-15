// export const onRequest = require('./ssr/index.js');
export function onRequest() {
    return new Response('Hello, world!');
}
