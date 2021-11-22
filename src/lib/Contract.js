import { ethers } from "ethers";

export default class Contract {

  constructor({address, name, abi}) {
    this.address = address
    this.name = name
    this.abi = abi
    this.iface = new ethers.utils.Interface(abi);
  }

  getName() {
    return this.name;
  }

  parseTransaction(data) {
    return this.iface.parseTransaction({data});
  }

  parseLogs(logsArray) {
    let parsed = logsArray.map(log => {
      return this.iface.parseLog(log)
    });
    return parsed;
  }

}
