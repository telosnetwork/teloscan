import { TelosEvmApi } from "@telosnetwork/telosevm-js";
import ContractManager from "src/lib/ContractManager";
import fetch from "node-fetch";
import axios from "axios";

const evm = new TelosEvmApi({
  endpoint: process.env.NETWORK_EVM_ENDPOINT,
  chainId: parseInt(process.env.NETWORK_EVM_CHAIN_ID),
  ethPrivateKeys: [],
  telosContract: process.env.NETWORK_EVM_CONTRACT,
  telosPrivateKeys: [],
  fetch
});

const contractManager = new ContractManager();
contractManager.init();

const hyperion = axios.create({
  baseURL: process.env.NETWORK_EVM_ENDPOINT
});

export default ({ Vue, store }) => {
  store.$evm = Vue.prototype.$evm = evm;
  store.$evmEndpoint = Vue.prototype.$evmEndpoint = hyperion;
  store.$contractManager = Vue.prototype.$contractManager = contractManager;
};

export { evm };
