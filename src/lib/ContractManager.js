import Contract from "src/lib/Contract";
import { ethers } from "ethers";
import Web3 from "web3";
import { getMetadata } from './aws.mjs';

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
    this.web3 = new Web3(process.env.NETWORK_EVM_RPC);
    this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_EVM_RPC);
  }

  async init() {
    await this.loadTokenList();
  }

  getWeb3Provider() {
    return this.web3;
  }

  getEthersProvider() {
    return this.ethersProvider;
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


  // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
  //    this is coming from the token transfer page where we're looking for a contract based on a token transfer event
  async getContract(address, suspectedToken) {
    const addressLower = address.toLowerCase();
    if (this.contracts[addressLower])
      return this.contracts[addressLower];
    
    const verified = await Contract.getVerificationStatus(address);
    const verfiedBool = verfied !== 404;
    if (verified.status !== 404){
        const metadata = await getMetadata(address);
        const token = getToken(address);
        this.contracts[adddressLower] =
        new Contract({
          name: `${address.slice(0,16)}...`,
          address,
          abi: metadata.output.abi,
          manager: this,
          token,
          verfied: verfiedBool
        })
    }
    // TODO: there's some in this list that are not ERC20... they have extra stuff like the Swapin method
    const contract = await this.getContractFromTokenList(address);
    if (contract) {
      this.contracts[addressLower] = contract;
      return contract;
    }

    if (suspectedToken) {
      console.log(addressLower);
      const erc20Data = await this.getErc20Data(address);
      if (erc20Data) {
        const contract = new Contract({
          name: `${erc20Data.name} (${erc20Data.symbol})`,
          address,
          abi: erc20Abi,
          manager: this,
          token: Object.assign({
            address,
          }, erc20Data)
        });

        this.contracts[addressLower] = contract;
        return contract;
      }
    }

    return new Contract({
      name: `${address.slice(0,16)}...`,
      address,
      abi: undefined,
      manager: this
    })
  }

  async getErc20Data(address) {
    const contract = new ethers.Contract(address, erc20Abi, this.getEthersProvider());
    try {
      const decimals = await contract.decimals();
      if (!decimals)
        return;

      const name = await contract.name.call();
      const symbol = await contract.symbol.call();
      if (!symbol || !name)
        return;

      return {name, symbol, decimals};
    } catch (e) {
      return;
    }
  }

  async loadTokenList() {
    const results = await tokenListAxios.get(tokenList);
    this.tokenList = results.data;
  }

  async getTokenList() {
    if (!this.tokenList){
      await this.loadTokenList();
    }
    return this.tokenList;
  }

  getToken(address){
    let i = this.tokenList.tokens.length;
    while (i--) {
      if (this.tokenList.tokens[i].address.toLowerCase() === address.toLowerCase()){
        return this.tokenList.tokens[i];
      }
    }
    return null;
  }

  async getContractFromTokenList(address) {
    const token = this.getToken(address);
    return new Contract({
      name: `${token.name} (${token.symbol})`,
      address,
      abi: erc20Abi,
      manager: this,
      token
    });
  }
}
