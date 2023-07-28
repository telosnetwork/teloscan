// Can migrate this to typescript, likely steps needed:
//   - add the functions directory to the tsconfig so it gets compiled
//   - change the CI workflow so it copies only the .js files

export function onRequest(context) {
    console.dir(context);
    return new Response(`Hello, ${context.env.NETWORK} world!!!!!!!!`);
}
