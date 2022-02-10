import { ethers } from "ethers";
import { getSource, isVerified } from './aws.js';
export default class Contract {

  constructor({address, name, abi, manager, token, verified = false}) {
    this.address = address
    this.name = name
    this.abi = abi
    this.manager = manager;
    if (abi)
      this.iface = new ethers.utils.Interface(abi);

    if (token)
      this.token = token;
    this.verified = verified;
    this.sources = []
  }

  static async getVerificationStatus(address){
    return await isVerified(address);
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

  async fetchSources(){
    this.sources = await getSource(this.address);
  }

  getSources(){
    return this.sources;
  }

  getContractInstance(provider) {
    if (!this.abi){
      console.log("Cannot create contract instance without ABI!");
      return;
    }

    if (!this.contract)
      this.contract = new ethers.Contract(this.address, this.abi, provider ? provider : this.manager.getEthersProvider());

    return this.contract;
  }

  call(functionName, args) {

  }

  async parseTransaction(data) {
    if (this.iface) {
      try {
        return this.iface.parseTransaction({data});
      } catch (e) {
        console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
      }
    }

    // this functionIface is an interface for a single function signature as discovered via 4bytes.directory... only use it for this function
    const functionIface = await this.manager.getFunctionIface(data);
    if (functionIface) {
      return functionIface.parseTransaction({data});
    }
  }

  async parseLogs(logsArray) {
    if (this.iface) {
      let parsed = logsArray.map(log => {
        return this.iface.parseLog(log)
      });
      return parsed;
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
