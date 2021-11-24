import Contract from "src/lib/Contract";
import { ethers } from "ethers";

const tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;

import axios from "axios";
import erc20Abi from "erc-20-abi";

const tokenListAxios = axios.create({
  baseURL: tokenList
});

export default class ContractManager {

  constructor(evmEndpoint) {
    this.tokenList = null;
    this.contracts = {};
    this.functionInterfaces = {};
    this.eventInterfaces = {};
    this.evmEndpoint = evmEndpoint;
  }

  async init() {
    await this.loadTokenList();
  }

  async getFunctionIface(data) {
    let prefix = data.toLowerCase().slice(0, 10);
    if (this.functionInterfaces.hasOwnProperty(prefix))
      return this.functionInterfaces[prefix];

    const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=function&hex=${prefix}`)
    if (abiResponse) {
      if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
        console.error(`Unable to find function signature for sig: ${prefix}`);
        return;
      }

      const iface = new ethers.utils.Interface([`function ${abiResponse.data.text_signature}`]);
      this.functionInterfaces[prefix] = iface;
      return iface;
    }
  }

  async getEventIface(data) {
    if (this.eventInterfaces.hasOwnProperty(data))
      return this.eventInterfaces[data];

    const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=event&hex=${data}`)
    if (abiResponse) {
      if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
        console.error(`Unable to find event signature for event: ${data}`);
        return;
      }

      const iface = new ethers.utils.Interface([`event ${abiResponse.data.text_signature}`]);
      this.eventInterfaces[data] = iface;
      return iface;
    }
  }


  async getContract(address) {
    const addressLower = address.toLowerCase();
    if (this.contracts[addressLower])
      return this.contracts[addressLower];

    // TODO: there's some in this list that are not ERC20... they have extra stuff like the Swapin method
    const contract = await this.getContractFromTokenList(address);
    if (contract) {
      this.contracts[addressLower] = contract;
      return contract;
    }

    return new Contract({
      name: `Contract (${address.slice(0,16)}...)`,
      address,
      abi: undefined,
      manager: this
    })
  }

  async loadTokenList() {
    if (!this.tokenList) {
      const results = await tokenListAxios.get(tokenList);
      this.tokenList = results.data;
    }
  }


  async getContractFromTokenList(address) {
    if (!this.tokenList)
      await this.loadTokenList();

    if (this.tokenList) {
      for (let i = 0; i < this.tokenList.tokens.length; i++) {
        let token = this.tokenList.tokens[i];
        if (token.address.toLowerCase() === address.toLowerCase()) {
          return new Contract({
            name: `${token.name} (${token.symbol})`,
            address,
            abi: erc20Abi,
            manager: this,
            token
          });
        }
      }
    }
  }

}
