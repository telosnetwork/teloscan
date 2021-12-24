// const path = require('path');
// const fs = require('fs');
const solc = require('solc');
const util = require('util');
const Web3EthAbi = require('web3-eth-abi');



var input = {
    language: 'Solidity',
    sources: {
      'test.sol': {
        content: `pragma solidity ^0.8.11;
            contract A { 
                function set(uint _value) public {}
                function get() public view returns (uint) { return value; }
                uint value;
            }
            contract B { 
                function set(uint _value) public { myValue= _value; }
                function get() public view returns (uint) { return value + myValue; }
                constructor(uint _constructorArg, uint32 _test) public {
                    value = _constructorArg;
                }
                uint value;
                uint myValue;
            }`
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };
  
  var output = JSON.parse(solc.compile(JSON.stringify(input)));
  console.log(output)
  for (var contractName in output.contracts['test.sol']) {

    const abi = output.contracts['test.sol'][contractName].abi;
    const bytecode = output.contracts['test.sol'][contractName].evm.bytecode.object;

    console.log("contract: ",contractName);
    console.log("bytecode: ", bytecode);
    console.log(util.inspect(abi, false, null, true))

    const constructorObj = abi.filter(obj => { return obj.type === 'constructor'});
    const constructorArgs = constructorObj.length ? constructorObj[0].inputs : null;
    const constructorArgTypeArray = [];

    if (constructorArgs){
        for (constructorArg of constructorArgs){
            constructorArgTypeArray.push(constructorArg.type);
        }
    }
    console.log(constructorArgTypeArray);

    const encodedConstructorArg = Web3EthAbi.encodeParameter('address[]',['0x46ef48e06ff160f311d17151e118c504d015ec6e','0x2ef6e246ab8ca985044e733f696e08940414d57b','0xb21f27b9c4137849c8a991fe1c18ab72a2f81eb6','0xf0776febc8a729b60602e2c2f6c446a518df78fe','0x34d6a1fd8aa15cfb00d6c6d47963d5e4e32ac2b8'])
    const decodedConstructorArg = Web3EthAbi.decodeParameter('address[]', encodedConstructorArg);
    console.log(encodedConstructorArg);
    console.log(decodedConstructorArg)
}