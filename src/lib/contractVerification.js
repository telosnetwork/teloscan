// const path = require('path');
// const fs = require('fs');
const solc = require('solc');
const util = require('util');
const Web3EthAbi = require('web3-eth-abi');

const fileName = 'test.sol';
const fileContent = `pragma solidity ^0.8.11;
contract A { 
    function set(uint _value) public {}
    function get() public view returns (uint) { return value; }
    uint value;
}
contract B { 
    function set(uint _value) public { myValue= _value; }
    function get() public view returns (uint) { return value + myValue; }
    constructor(uint _constructorArg, address _test) public {
        value = _constructorArg;
    }
    uint value;
    uint myValue;
}`;
  
  const output = compileFile(fileName, fileContent);
  processFile(output);

function compileFile(contractName, contractContent){
    let output;
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
    input.sources[contractName] = { content: contractContent };
    output = JSON.parse(solc.compile(JSON.stringify(input)));

    return output
}

function processFile(output){
    for (let contractName in output.contracts['test.sol']) {
        const bytecode = output.contracts['test.sol'][contractName].evm.bytecode.object;
        const abi = output.contracts['test.sol'][contractName].abi;
    
        const encodedConstructorArgs = getEncodedConstructorArgs(abi, 42,"0x46ef48e06ff160f311d17151e118c504d015ec6e");
        const decodedConstructorArgs = getDecodedConstructorArgs(abi, encodedConstructorArgs);
    
        console.log("contract: ",contractName);
        console.log("bytecode: ", bytecode);
        console.log("abi: ", util.inspect(abi, false, null, true));
        console.log("encoded args: ", encodedConstructorArgs);
        console.log("decoded args: ",decodedConstructorArgs);
      }
}

function getEncodedConstructorArgs(abi, ...args){
    const typesArr = [];
    const constructorObj = abi.find(obj => { return obj.type === 'constructor' });
    if (!constructorObj || constructorObj.inputs.length != args.length){
        return;
    }
    for (let i=0; i<constructorObj.inputs.length; i++){
        typesArr.push(constructorObj.inputs[i].type);
    }
    const encoded = Web3EthAbi.encodeParameters(typesArr, args)

    return encoded;
}

function getDecodedConstructorArgs(abi, encodedHex){
    const typesArr = [];
    const constructorObj = abi.find(obj => { return obj.type === 'constructor' });
    if (!constructorObj || constructorObj.inputs.length < 1){
        return;
    }
    for (let i=0; i<constructorObj.inputs.length; i++){
        typesArr.push(constructorObj.inputs[i].type);
    }
    const decoded = Web3EthAbi.decodeParameters(typesArr, encodedHex)

    return decoded;
}