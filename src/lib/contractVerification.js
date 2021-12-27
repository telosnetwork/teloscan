// https://ethereum.github.io/solc-bin/bin/list.json #use this to get compiler version list
// web3.eth.getCode("0xd5677cf67b5aa051bb40496e68ad359eb97cfbf8") #example to get bytecode for deployed contract

// const path = require('path');
// const fs = require('fs');
const solc = require('solc');
const util = require('util');
const Web3EthAbi = require('web3-eth-abi');

const NONE = 'n/a';
const versionString = "v0.7.1+commit.f4a555be";
const fileName = 'test.sol';
const fileContent = 
`pragma solidity ^0.7.1;
contract A { 
    uint value;
    function get() public view returns (uint) { return value; }
    function set(uint _value) public { value = _value; }
}
contract B { 
    uint value;
    uint myValue;
    address initAddress;
    constructor(uint _constructorArg, address _address) {
        value = _constructorArg;
        initAddress = _address;
    }
    function set(uint _value) public { myValue= _value; }
    function get() public view returns (uint) { return value + myValue; }
}`;
const constructorArgs = [42,"0x46ef48e06ff160f311d17151e118c504d015ec6e"];
  

processFile = async (fileName, fileContent) => {
    const input = {
        language: 'Solidity',
        sources: {},
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };
    input.sources[fileName] = { content: fileContent };

    const output = await compileFile(input);

    for (let contractName in output.contracts[fileName]) {
        let encodedConstructorArgs = NONE; 
        let decodedConstructorArgs = NONE;

        const bytecode = output.contracts[fileName][contractName].evm.bytecode.object;
        const abi = output.contracts[fileName][contractName].abi;
        const argTypes = getArgTypes(abi);

        if (argTypes.length) {
            try{
                encodedConstructorArgs = Web3EthAbi.encodeParameters(argTypes, constructorArgs)
                decodedConstructorArgs = Web3EthAbi.decodeParameters(argTypes, encodedConstructorArgs) 
            }catch(e){
                console.error(e);
            }
        }
    
        console.log("contract: ",contractName);
        console.log("bytecode: ", bytecode);
        console.log("abi: ", util.inspect(abi, false, null, true));
        console.log("encoded args: ", encodedConstructorArgs);
        console.log("decoded args: ",decodedConstructorArgs);
        
        if (encodedConstructorArgs !== NONE){
            console.log("bytecode w/constructor args: ", bytecode + encodedConstructorArgs.substring(2))
        }
    }
}

compileFile = async (input) => {
    return await new Promise((resolve,reject) => {
        solc.loadRemoteVersion(versionString, (e, solcVersion) => {
            e ? reject(e) : resolve(JSON.parse(solcVersion.compile(JSON.stringify(input))));
        });
    })
}

getArgTypes = (abi) => {
    const typesArr = [];
    const constructorObj = abi.find(obj => { return obj.type === 'constructor' });
    if (constructorObj && constructorObj.inputs.length > 0){
        for (let i=0; i<constructorObj.inputs.length; i++){
            typesArr.push(constructorObj.inputs[i].type);
        }
    }

    return typesArr;
}

( async () => { await processFile(fileName, fileContent) })();
