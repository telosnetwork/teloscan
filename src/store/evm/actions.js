import { BigNumber } from "ethers";

let rpcId = 0;

export async function doRPC(_, { method, params }) {
  const rpcPayload = {
    jsonrpc: "2.0",
    id: ++rpcId,
    method,
    params
  };
  const result = await this.$evmEndpoint.post("/evm", rpcPayload);

  return result.data;
}

// TODO: make sure we're not using this and remove... should be using the $contractManager that's on prototype (this.$contractManager)
export async function getContract(_, { address }) {
  return await this.$contractManager.getContract(address);
}

export const fetchTlosPrice = async function({ commit }) {
  try {
    const response = await this.$api.getTableRows({
      code: "delphioracle",
      limit: "1000",
      scope: "tlosusd",
      table: "datapoints"
    });

    const tlosPrice = response.rows[0].median / 10000;
    commit("setTlosPrice", tlosPrice);
  } catch (error) {
    console.error("fetchTlosPrice");
    commit("general/setErrorMsg", error.message || error, { root: true });
  }
};

export const fetchGasPrice = async function({ commit }) {
  try {
    const response = await this.$api.getTableRows({
      code: "eosio.evm",
      scope: "eosio.evm",
      table: "config",
      limit: "1"
    });

    let gasPrice = response.rows[0].gas_price;
    gasPrice = BigNumber.from("0x" + gasPrice);
    commit("setGasPrice", gasPrice);
  } catch (error) {
    console.error("fetchGasPrice");
    commit("general/setErrorMsg", error.message || error, { root: true });
  }
};

export const fetchLatestBlock = async function({ commit }) {
  try {
    const response = await this.$api.getTableRows({
      code: "eosio.evm",
      scope: "eosio.evm",
      table: "config",
      limit: "1"
    });

    const lastBlock = response.rows[0].last_block;
    commit("setLatestBlock", lastBlock);
  } catch (error) {
    console.error("fetchLatestBlock");
    commit("general/setErrorMsg", error.message || error, { root: true });
  }
};
