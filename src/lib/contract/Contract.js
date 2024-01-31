/* eslint-disable */
import { ethers } from 'ethers';
import {markRaw} from "vue";

export default class Contract {

  constructor({address, creationInfo, name, abi, manager, supportedInterfaces = [], properties = {}, verified = false, nfts = {}, autoloadedAbi }) {
    this.autoloadedAbi = autoloadedAbi;
    this.address = address;
    this.name = name || properties?.name;
    this.nfts = {};
    this.abi = abi;
    if(supportedInterfaces?.length > 0){
      const index = supportedInterfaces?.indexOf('none');
      this.supportedInterfaces = [];
      for(let i = 0; i < supportedInterfaces.length; i++){
        if(i !== index){
          this.supportedInterfaces.push(supportedInterfaces[i])
        }
      }
    }
    this.properties = properties;
    if (abi){
      this.iface = markRaw(new ethers.utils.Interface(abi));
    }
    this.verified = verified;
    this.sources = [];
    this.creationInfo = creationInfo;
  }

  isVerified() {
    return this.verified;
  }

  setVerified(verified) {
    this.verified = verified;
    return this;
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

  isAutoloadedAbi() {
    return this.autoloadedAbi;
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
