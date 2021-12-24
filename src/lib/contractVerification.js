// const path = require('path');
// const fs = require('fs');
const solc = require('solc');
const util = require('util');
const Web3EthAbi = require('web3-eth-abi');

const NO_ARGS = '0x0';
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
const constructorArgs = [42,"0x46ef48e06ff160f311d17151e118c504d015ec6e"]
  
processFile(fileName, fileContent);

function processFile(fileName, fileContent){
    const output = compileFile(fileName, fileContent);
    for (let contractName in output.contracts['test.sol']) {
        const encodedConstructorArgs = 'n/a'; 
        const decodedConstructorArgs = 'n/a';
        const bytecode = output.contracts['test.sol'][contractName].evm.bytecode.object;
        const abi = output.contracts['test.sol'][contractName].abi;
        const argTypes = getArgTypes(abi);

        if (argTypes.length) {
            encodedConstructorArgs = Web3EthAbi.encodeParameters(argTypes, constructorArgs)
            decodedConstructorArgs = Web3EthAbi.decodeParameters(typesArr, encodedHex) 
        }
    
        console.log("contract: ",contractName);
        console.log("bytecode: ", bytecode);
        console.log("abi: ", util.inspect(abi, false, null, true));
        console.log("encoded args: ", encodedConstructorArgs);
        console.log("decoded args: ",decodedConstructorArgs);
    }
}

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

function getArgTypes(abi){
    const typesArr = [];
    const constructorObj = abi.find(obj => { return obj.type === 'constructor' });
    if (constructorObj && constructorObj.inputs.length > 0){
        for (let i=0; i<constructorObj.inputs.length; i++){
            typesArr.push(constructorObj.inputs[i].type);
        }
    }

    return typesArr;
}