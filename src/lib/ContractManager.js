import Contract from "src/lib/Contract";

let tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;
import axios from "axios";
import erc20Abi from "erc-20-abi";

const tokenListAxios = axios.create({
  baseURL: tokenList
});

export default class ContractManager {

  constructor() {
    this.tokenList = null;
    this.contracts = {};
  }

  async init() {
    await this.loadTokenList();
  }

  async getContract(address) {
    const addressLower = address.toLowerCase();
    if (this.contracts[addressLower])
      return this.contracts[addressLower];

    const contract = await this.getContractFromTokenList(address);
    if (contract) {
      this.contracts[addressLower] = contract;
      return contract;
    }
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
            abi: erc20Abi,
            isERC20: true
          });
        }
      }
    }
  }

}
