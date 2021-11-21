import Web3 from "web3";

export default class Contract {

  constructor({address, name, abi}) {
    this.address = address
    this.name = name
    this.abi = abi
    this.functionSigMap = {};
    this.web3 = new Web3();
    this.generateFunctionSigs();
  }

  getName() {
    return this.name;
  }

  generateFunctionSigs() {
    if (!this.abi)
      return;

    for (let i = 0; i < this.abi.length; i++) {
      const thisType = this.abi[i];
      this.functionSigMap[this.web3.eth.abi.encodeFunctionSignature(thisType)] = thisType;
    }
  }

  // TODO: somehow do fall backs to sourcify or https://www.4byte.directory/ or our own solution
  getFunctionSignature(data) {
    let type = this.functionSigMap[data.slice(0, 10)];
    if (type)
      return type.name;
  }


}
