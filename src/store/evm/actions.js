/*
export function someAction (context) {
}
*/
let rpcId = 0;

export async function doRPC ({ commit, dispatch },{method, params}) {
  const rpcPayload = {
    jsonrpc: '2.0',
    id: ++rpcId,
    method, params
  }
  const result = await this.$evmEndpoint.post('/evm', rpcPayload);

  return result.data;
}
