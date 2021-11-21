/*
export function someAction (context) {
}
*/
import Contract from "src/lib/Contract";

let rpcId = 0;

let tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;
let tokenFile;
import axios from "axios";
import erc20Abi from "erc-20-abi";
const contracts = {};

const tokenListAxios = axios.create({
  baseURL: tokenList
});

export async function doRPC ({ commit, dispatch },{method, params}) {
  const rpcPayload = {
    jsonrpc: '2.0',
    id: ++rpcId,
    method, params
  }
  const result = await this.$evmEndpoint.post('/evm', rpcPayload);

  return result.data;
}

// TODO: make sure we're not using this and remove... should be using the $contractManager that's on prototype (this.$contractManager)
export async function getContract ({ commit, dispatch }, {address}) {
  return await this.$contractManager.getContract(address);
}
