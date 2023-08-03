// Can migrate this to typescript, likely steps needed:
//   - add the functions directory to the tsconfig so it gets compiled
//   - change the CI workflow so it copies only the .js files


export function onRequest(context) {
    /*
    const env = require('../public/env')(context);
    console.dir(context);
    const apiEndpoint = env.NETWORK_EVM_RPC;
    return new Response(`Hello, ${context.env.NETWORK} world!!!!!!!!\n\nNetwork RPC is: ${apiEndpoint}`);
     */
    return new Response(`Hello, world!`);
}
