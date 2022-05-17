import Contract from "src/lib/Contract";
import { ethers } from "ethers";
import Web3 from "web3";
import axios from "axios";
import erc20Abi from "erc-20-abi";
import erc721Abi from  "./erc721";
import { toChecksumAddress } from "./utils";

const contractsBucket = axios.create({
  baseURL: `https://${process.env.VERIFIED_CONTRACTS_BUCKET}.s3.amazonaws.com`
});

const tokenList = `https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json`;
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

  async getContractCreation(address) {
    try {
      const v2ContractResponse = await this.evmEndpoint.get(`/v2/evm/get_contract?contract=${address}`)
      return v2ContractResponse.data
    } catch (e) {
      console.error(e.message);
    }
  }

  // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
  //    this is coming from the token transfer page where we're looking for a contract based on a token transfer event
  async getContract(address, suspectedToken) {
    const addressLower = address.toLowerCase();

    if (this.contracts[addressLower]){
      return this.contracts[addressLower];
    }

    const creationInfo = await this.getContractCreation(addressLower);

    const metadata = await this.checkBucket(address);
    if (metadata){
      return await this.getVerifiedContract(addressLower, metadata, creationInfo)
    }
    // TODO: there's some in this list that are not ERC20... they have extra stuff like the Swapin method
    const contract = await this.getContractFromTokenList(address, creationInfo);
    if (contract) {
      this.contracts[addressLower] = contract;
      return contract;
    }

    if (suspectedToken) {
      const tokenData = await this.getTokenData(address, suspectedToken);
      if (tokenData) {
        return await this.getTokenContract(addressLower, tokenData, creationInfo);
      }
    }

    return await this.getEmptyContract(addressLower, creationInfo);
  }

  async checkBucket(address){
    let checksumAddress = toChecksumAddress(address);
    try{
      let responseData = (await contractsBucket.get(`${checksumAddress}/metadata.json`)).data;
      return JSON.parse(responseData.content);
    }catch(e){
      console.log(e);
      return false;
    }
  }

  async getVerifiedContract(address, metadata, creationInfo) {
    const token = await this.getToken(address);
    const contract =
    new Contract({
      name: Object.values(metadata.settings.compilationTarget)[0],
      address,
      abi: metadata.output.abi,
      manager: this,
      token, creationInfo,
      verified: true
    });
    this.contracts[address] = contract;
    return contract;
  }

  async getTokenContract(address, tokenData, creationInfo){
    const contract = new Contract({
      name: tokenData.symbol ? `${tokenData.name} (${tokenData.symbol})` : tokenData.name,
      address,
      abi: erc20Abi,
      manager: this,
      creationInfo,
      token: Object.assign({
        address,
      }, tokenData)
    });

    this.contracts[address] = contract;
    return contract;
  }

  async getEmptyContract(address, creationInfo){
    const contract = new Contract({
      name: `${address.slice(0,16)}...`,
      address, creationInfo,
      abi: undefined,
      manager: this
    });
    this.contracts[address] = contract;
    return contract;
  }

  async getTokenData(address, type) {
    const contract = new ethers.Contract(address, type === 'erc20' ? erc20Abi : erc721Abi, this.getEthersProvider());
    try {
      let tokenData = {};
      tokenData.name = await contract.name.call();
      if (!tokenData.name)
        return;

      tokenData.symbol = await contract.symbol.call();

      if (!tokenData.symbol)
        return;

      if (type == 'erc20') {
        tokenData.decimals = await contract.decimals();
      }

      // TODO: if this is erc721, could we get more info about it and maybe read the metadata to link to the image?
      // can't be sure if this contract would support ERC721Metadata, but something like:
      // if (type == 'erc721') tokenData.baseURI = await contract.baseURI();

      return tokenData;
    } catch (e) {
      return;
    }
  }

  async loadTokenList() {
    const results = await axios.get(tokenList);
    const { tokens } = results.data;
    results.data.tokens = (tokens ?? []).filter(({ chainId }) => chainId = process.env.NETWORK_EVM_CHAIN_ID);

    this.tokenList = results.data;
  }

  async getTokenList() {
    if (!this.tokenList){
      await this.loadTokenList();
    }
    return this.tokenList;
  }

  async getToken(address){
    if (!this.tokenList)
      await this.loadTokenList();

    let i = this.tokenList.tokens.length;
    while (i--) {
      if (this.tokenList.tokens[i].address.toLowerCase() === address.toLowerCase()){
        return this.tokenList.tokens[i];
      }
    }
    return null;
  }

  async getContractFromTokenList(address, creationInfo) {
    const token = await this.getToken(address);
    if (token) {
      return new Contract({
        name: `${token.name} (${token.symbol})`,
        address, creationInfo,
        abi: erc20Abi,
        manager: this,
        token
      });
    }
  }
}
