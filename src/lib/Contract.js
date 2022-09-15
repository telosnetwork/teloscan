/* eslint-disable */

import { ethers } from "ethers"; import { markRaw } from 'vue'
export default class Contract {

  constructor({address, creationInfo, name, abi, manager, token, verified = false}) {
    this.address = address
    this.name = name
    this.abi = abi
    this.manager = manager;
    if (abi){
      this.iface =   markRaw(new ethers.utils.Interface(abi));
    }
    if (token){
      this.token = token;
    }
    this.verified = verified;
    this.sources = [];
    this.creationInfo = creationInfo;
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

  getCreationTrx() {
    if (!this.creationInfo)
      return;

    return this.creationInfo.creation_trx;
  }

  getCreator() {
    if (!this.creationInfo)
      return;

    return this.creationInfo.creator;
  }

  getContractInstance(provider, createNew=false) {
    if (!this.abi){
      console.log("Cannot create contract instance without ABI!");
      return;
    }

    if (!this.contract || createNew){
      this.contract = new ethers.Contract(this.address, this.abi, provider ? provider : this.manager.getEthersProvider());
    }
    return this.contract;
  }

  call(functionName, args) {

  }

  async parseTransaction(data) {
    if (this.iface) {
      try {

        return await this.iface.parseTransaction({data});
      } catch (e) {
        console.error(`Failed to parse transaction data ${data} using abi for ${this.address}: ${e.message}`);
        console.log(this.iface);
      }
    }
    try {
      // this functionIface is an interface for a single function signature as discovered via 4bytes.directory... only use it for this function
      const functionIface = await this.manager.getFunctionIface(data);
      if (functionIface) {
        return functionIface.parseTransaction({data});
      }
    } catch (e) {
      console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
    }
  }

  async parseLogs(logsArray) {
    if (this.iface) {
      let parsedArray = logsArray.map(log => {
        try {
          let parsedLog = this.iface.parseLog(log);
          parsedLog.address = log.address;
          return parsedLog;
        } catch (e) {
          console.log(`Failed parsing log event: ${e.message}`)
          return log;
        }
      });
      parsedArray.forEach(parsed => {
        if(parsed.name){
          parsed.inputs = parsed.eventFragment.inputs;
        }
      })
      return parsedArray;
    }

    // TODO: This works very inconsistently... need to dig deeper, example http://localhost:8080/tx/0x817b1596365bb402c45b53d67be7808fb204e3842cf61587777d92a3ce909d16
    //   note that the Sync event works fine, but the rest do not
    return await Promise.all(logsArray.map(async log => {
      const eventIface = await this.manager.getEventIface(log.topics[0]);
      if (eventIface) {
        try {
          return eventIface.parseLog(log);
        } catch {
          console.error(`Failed to parse log ${JSON.stringify(log, null, 4)}\n\nfrom event interface: ${JSON.stringify(eventIface, null, 4)}`)
        }
      }
      return log;
    }))
  }

}
