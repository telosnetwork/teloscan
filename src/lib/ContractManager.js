import Contract from "src/lib/Contract";
import { ethers } from "ethers";

const tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;
const sigDirUrl = `https://www.4byte.directory`

import axios from "axios";
import erc20Abi from "erc-20-abi";

const tokenListAxios = axios.create({
  baseURL: tokenList
});

const sigDirectoryAxios = axios.create({
  baseURL: sigDirUrl
});

export default class ContractManager {

  constructor() {
    this.tokenList = null;
    this.contracts = {};
    this.functionInterfaces = {};
    this.eventInterfaces = {};
  }

  async init() {
    await this.loadTokenList();
  }

  async getFunctionIface(data) {
    let prefix = data.toLowerCase().slice(0, 10);
    if (this.functionInterfaces.hasOwnProperty(prefix))
      return this.functionInterfaces[prefix];

    const dirResponse = await sigDirectoryAxios.get(`/api/v1/signatures/?hex_signature=${prefix}`)
    if (dirResponse) {
      if (!dirResponse.data || !dirResponse.data.results || !dirResponse.data.results.length > 0) {
        console.error(`Unable to find function signature from 4bytes.directory for sig: ${prefix}`);
        return;
      }

      const iface = new ethers.utils.Interface([`function ${dirResponse.data.results[0].text_signature}`]);
      this.functionInterfaces[prefix] = iface;
      return iface;
    }
  }

  async getEventIface(data) {
    if (this.eventInterfaces.hasOwnProperty(data))
      return this.eventInterfaces[data];

    const dirResponse = await sigDirectoryAxios.get(`/api/v1/event-signatures/?hex_signature=${data}`)
    if (dirResponse) {
      if (!dirResponse.data || !dirResponse.data.results || !dirResponse.data.results.length > 0) {
        console.error(`Unable to find event signature from 4bytes.directory for event: ${data}`);
        return;
      }

      const iface = new ethers.utils.Interface([`event ${dirResponse.data.results[0].text_signature}`]);
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
      name: "Unknown Contract",
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
          return new Contract(
          {
            name: `${token.name} (${token.symbol})`,
            address,
            abi: erc20Abi,
            manager: this
          });
        }
      }
    }
  }

}
