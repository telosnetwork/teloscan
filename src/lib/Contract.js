/* eslint-disable */

import { ethers } from "ethers";
import { markRaw } from 'vue';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

export default class Contract {

  constructor({address, creationInfo, name, abi, manager, token, verified = false}) {
    this.address = address
    this.name = name
    this.abi = abi
    this.manager = manager;
    if (abi){
      this.iface = markRaw(new ethers.utils.Interface(abi));
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

  async parseTransaction(data) {
    if (this.iface) {
      try {

        return await this.iface.parseTransaction({data});
      } catch (e) {
        console.log(`Failed to parse transaction data ${data} using abi for ${this.address}`);
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

  formatLog(log, parsedLog){
    parsedLog.function_signature = log.topics[0].substr(0, 10);
    parsedLog.isTransfer = TRANSFER_SIGNATURES.includes(parsedLog.function_signature);
    parsedLog.logIndex = log.logIndex;
    parsedLog.address = log.address;
    parsedLog.token = this.token;
    parsedLog.name = (parsedLog.signature) ? parsedLog.signature : null;
    return parsedLog;
  }

  async parseLogs(logsArray) {
    if (this.iface) {
      let parsedArray = await Promise.all(logsArray.map(async (log) => {
        try {
          let parsedLog = this.iface.parseLog(log);
          parsedLog = this.formatLog(log, parsedLog);
          return parsedLog;
        } catch (e) {
          let parsedLog = await this.parseEvent(log);
          return  this.formatLog(log, parsedLog);
        }
      }));
      parsedArray.forEach(parsed => {
        if(parsed.name && parsed.eventFragment && parsed.eventFragment.inputs){
          parsed.inputs = parsed.eventFragment.inputs;
        }
      })
      return parsedArray;
    }


    return await Promise.all(logsArray.map(async log => {
      let parsedLog = await this.parseEvent(log);
      parsedLog = this.formatLog(log, parsedLog);
    }))
  }

  async parseEvent(log){
    const eventIface = await this.manager.getEventIface(log.topics[0]);
    if (eventIface) {
      try {
        let parsedLog = eventIface.parseLog(log);
        parsedLog = this.formatLog(log, parsedLog);
        return parsedLog;
      } catch(e) {
        console.log(`Failed to parse log ${log.logIndex} from event interface`)
      }
    }
    return log;
  }

}
