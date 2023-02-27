/* eslint-disable */
import { ethers } from 'ethers';
import {markRaw} from "vue";

export default class Contract {

  constructor({address, creationInfo, name, abi, manager, supportedInterfaces = [], properties = {}, verified = false, nfts = {}}) {
    this.address = address;
    this.name = name || properties?.name;
    this.nfts = {};
    this.abi = abi;
    this.supportedInterfaces = supportedInterfaces;
    this.properties = properties;
    if (abi){
      this.iface = markRaw(new ethers.utils.Interface(abi));
    }
    this.verified = verified;
    this.sources = [];
    this.creationInfo = creationInfo;
  }

  getInstance(){

  }
  isVerified() {
    return this.verified;
  }

  isNonFungible() {
    return (
        this.supportedInterfaces.includes('erc721')
    );
  }

  isToken() {
    if(this.supportedInterfaces === null) return;
    return (
        this.supportedInterfaces.includes('erc721') ||
        this.supportedInterfaces.includes('erc1155') ||
        this.supportedInterfaces.includes('erc20')
    );
  }

  getNfts() {
    return this.nfts;
  }

  getInterface() {
    return this.iface;
  }

  getAddress() {
    return this.address;
  }

  getAbi() {
    return this.abi;
  }

  getSupportedInterfaces() {
    return this.supportedInterfaces;
  }

  getProperties() {
    return this.properties;
  }

  getName() {
    return this.name;
  }

  setVerified(status) {
    this.verified = status;
  }

  getCreationBlock() {
    return this.creationInfo?.block;
  }

  getCreationTrx() {
    return this.creationInfo?.transaction;
  }

  getCreator() {
    return this.creationInfo?.creator;
  }

}
