// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title TupleInputFunctionsContract
 * @dev This contract demonstrates functions that take various structs (tuples) and complex data types as input parameters.
 * It is designed to test the interaction with functions that require both simple and complex tuples, as well as arrays.
 */
contract TupleInputFunctionsContract {

    /// @dev Simple structure with a single uint256 field.
    struct SimpleStruct {
        uint256 value;
    }

    /// @dev Structure with two fields of the same type, uint256.
    struct DoubleUintStruct {
        uint256 value1;
        uint256 value2;
    }

    /// @dev Structure with two fields of different types: address and uint256.
    struct AddressUintStruct {
        address user;
        uint256 amount;
    }

    /// @dev More complex structure with three fields of different types.
    struct ComplexStruct {
        uint256 id;
        address user;
        bool isActive;
    }

    /// @dev Structure that contains another structure (nested).
    struct NestedStruct {
        SimpleStruct simple;
        AddressUintStruct userInfo;
        bool isVerified;
    }

    /// @dev Event emitted when a function is called.
    event StructProcessed(string functionName, string message, bytes32 dataHash);

    /**
     * @notice Processes a simple tuple with a single uint256 field.
     * @param simple Struct with a `value` field.
     */
    function process01SimpleStruct(SimpleStruct memory simple) external {
        emit StructProcessed("process01SimpleStruct", "Processed simple struct with uint256.", keccak256(abi.encode(simple.value)));
    }

    /**
     * @notice Processes a tuple with two uint256 fields.
     * @param doubleUint Struct with `value1` and `value2` fields.
     */
    function process02DoubleUintStruct(DoubleUintStruct memory doubleUint) external {
        emit StructProcessed("process02DoubleUintStruct", "Processed struct with two uint256 fields.", keccak256(abi.encode(doubleUint.value1, doubleUint.value2)));
    }

    /**
     * @notice Processes a tuple with an address and a uint256.
     * @param addressUint Struct with an address and a uint256 field.
     */
    function process03AddressUintStruct(AddressUintStruct memory addressUint) external {
        emit StructProcessed("process03AddressUintStruct", "Processed struct with address and uint256.", keccak256(abi.encode(addressUint.user, addressUint.amount)));
    }

    /**
     * @notice Processes a more complex tuple with three mixed fields.
     * @param complex Struct with `id`, `user`, and `isActive` fields.
     */
    function process04ComplexStruct(ComplexStruct memory complex) external {
        emit StructProcessed("process04ComplexStruct", "Processed complex struct with uint256, address, and bool.", keccak256(abi.encode(complex.id, complex.user, complex.isActive)));
    }

    /**
     * @notice Processes a tuple that contains another nested struct.
     * @param nested Nested struct containing other structs.
     */
    function process05NestedStruct(NestedStruct memory nested) external {
        emit StructProcessed("process05NestedStruct", "Processed nested struct with simple and addressUint structs.", keccak256(abi.encode(nested.simple.value, nested.userInfo.user, nested.userInfo.amount, nested.isVerified)));
    }

    /**
     * @notice Processes a struct with a string field.
     * @param value A string field.
     */
    function process06String(string memory value) external {
        emit StructProcessed("process06String", "Processed struct with string field.", keccak256(abi.encode(value)));
    }

    /**
     * @notice Processes a struct with a bytes32 field.
     * @param value A bytes32 field.
     */
    function process07Bytes32(bytes32 value) external {
        emit StructProcessed("process07Bytes32", "Processed struct with bytes32 field.", keccak256(abi.encode(value)));
    }

    /**
     * @notice Processes an array of SimpleStruct.
     * @param values An array of SimpleStruct.
     */
    function process08ArrayOfStructs(SimpleStruct[] memory values) external {
        // Example logic: Process an array of structs.
        for (uint i = 0; i < values.length; i++) {
            emit StructProcessed("process08ArrayOfStructs", "Processed array of SimpleStruct.", keccak256(abi.encode(values[i].value)));
        }
    }

    /**
     * @notice Processes an array of uint256 values.
     * @param values An array of uint256 values.
     */
    function process09Uint256Array(uint256[] memory values) external {
        // Example logic: Process an array of uint256 values.
        emit StructProcessed("process09Uint256Array", "Processed uint256 array.", keccak256(abi.encode(values)));
    }

    /**
     * @notice Processes an array of string values.
     * @param values An array of string values.
     */
    function process10StringArray(string[] memory values) external {
        // Example logic: Process an array of strings.
        for (uint i = 0; i < values.length; i++) {
            emit StructProcessed("process10StringArray", "Processed string array.", keccak256(abi.encode(values[i])));
        }
    }

    /**
     * @notice Processes a fixed-size array of addresses.
     * @param addresses A fixed-size array of 3 addresses.
     */
    function process11FixedAddressArray(address[3] memory addresses) external {
        // Example logic: Process a fixed-size array of addresses.
        emit StructProcessed("process11FixedAddressArray", "Processed fixed-size address array.", keccak256(abi.encode(addresses)));
    }

    /**
     * @notice Processes an array of complex structs.
     * @param tuples An array of ComplexStruct.
     */
    function process12ArrayOfComplexStructs(ComplexStruct[] memory tuples) external {
        // Example logic: Process an array of complex structs.
        for (uint i = 0; i < tuples.length; i++) {
            emit StructProcessed("process12ArrayOfComplexStructs", "Processed array of ComplexStruct.", keccak256(abi.encode(tuples[i].id, tuples[i].user, tuples[i].isActive)));
        }
    }

    /**
     * @notice Processes a fixed-size array of tuples with mixed fields.
     * @param tuples An array of 3 ComplexStruct.
     */
    function process13FixedComplexArray(ComplexStruct[3] memory tuples) external {
        // Example logic: Process a fixed-size array of complex structs.
        for (uint i = 0; i < tuples.length; i++) {
            emit StructProcessed("process13FixedComplexArray", "Processed fixed-size array of ComplexStruct.", keccak256(abi.encode(tuples[i].id, tuples[i].user, tuples[i].isActive)));
        }
    }

    /**
     * @notice Processes a fixed-size array of nested structs.
     * @param tuples An array of 2 NestedStruct.
     */
    function process14FixedNestedArray(NestedStruct[2] memory tuples) external {
        // Example logic: Process a fixed-size array of nested structs.
        for (uint i = 0; i < tuples.length; i++) {
            emit StructProcessed("process14FixedNestedArray", "Processed fixed-size array of NestedStruct.", keccak256(abi.encode(tuples[i].simple.value, tuples[i].userInfo.user, tuples[i].userInfo.amount, tuples[i].isVerified)));
        }
    }
}
