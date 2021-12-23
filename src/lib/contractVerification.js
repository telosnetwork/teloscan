// const path = require('path');
// const fs = require('fs');
const solc = require('solc');

var input = {
    language: 'Solidity',
    sources: {
      'test.sol': {
        content: `pragma solidity ^0.8.11;
            contract A { 
                function set(uint _value) public { value = _value; }
                function get() public view returns (uint) { return value; }
                uint value;
            }
            contract B { 
                function set(uint _value) public { value = _value; }
                function get() public view returns (uint) { return value; }
                uint value;
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
  
  for (var contractName in output.contracts['test.sol']) {
    const abi = output.contracts['test.sol'][contractName].abi;
    const bytecode = output.contracts['test.sol'][contractName].evm.bytecode.object;
    console.log("contract: ",contractName);
    console.log("bytecode: ", bytecode);
    console.log("abi: ", abi);
  }