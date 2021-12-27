// const path = require('path');
// const fs = require('fs');
const solc = require('solc');
const util = require('util');
const Web3EthAbi = require('web3-eth-abi');

const NONE = 'n/a';
const fileName = 'test.sol';
const fileContent = 
`pragma solidity ^0.8.11;
contract A { 
    uint value;
    function get() public view returns (uint) { return value; }
    function set(uint _value) public { value = _value; }
}
contract B { 
    uint value;
    uint myValue;
    constructor(uint _constructorArg, address _test) public {
        value = _constructorArg;
    }
    function set(uint _value) public { myValue= _value; }
    function get() public view returns (uint) { return value + myValue; }
}`;
const constructorArgs = [42,"0x46ef48e06ff160f311d17151e118c504d015ec6e"]
  
processFile(fileName, fileContent);

function processFile(fileName, fileContent){
    const output = compileFile(fileName, fileContent);
    for (let contractName in output.contracts['test.sol']) {
        let encodedConstructorArgs = NONE; 
        let decodedConstructorArgs = NONE;
        const bytecode = output.contracts['test.sol'][contractName].evm.bytecode.object;
        const abi = output.contracts['test.sol'][contractName].abi;
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
        if (encodedConstructorArgs !== NONE){
            console.log("bytecode w/constructor args:")
        }
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

    try{
        output = JSON.parse(solc.compile(JSON.stringify(input)));
    }catch(e){
        console.error(e);
    }

    return output;
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