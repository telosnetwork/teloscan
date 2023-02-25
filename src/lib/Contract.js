/* eslint-disable */

export default class Contract {

  constructor({address, creationInfo, name, abi, manager, supportedInterfaces = [], properties = {}, verified = false, nfts = {}}) {
    this.address = address;
    this.name = name;
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

  isVerified() {
    return this.verified;
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
