/*
export function someAction (context) {
}
*/
let rpcId = 0;

let tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;
let tokenFile;
import axios from "axios";
import erc20Abi from "erc-20-abi";

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

export async function getContract ({ commit, dispatch}, {address}) {
  if (!tokenFile) {
    const results = await tokenListAxios.get(tokenList);
    tokenFile = results.data;
  }

  if (tokenFile) {
    for (let i = 0; i < tokenFile.tokens.length; i++) {
      let token = tokenFile.tokens[i];
      if (token.address.toLowerCase() === address.toLowerCase()) {
        return {
          name: `${token.name} (${token.symbol})`,
          abi: erc20Abi,
          isERC20: true
        }
      }
    }
  }
}
