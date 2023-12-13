import { BigNumber, ethers } from 'ethers';
import { defineAsyncComponent } from 'vue';

const asyncInputComponents = {
    AddressInput: defineAsyncComponent(() => import('components/inputs/AddressInput')),
    AddressArrayInput: defineAsyncComponent(() => import('components/inputs/AddressArrayInput')),
    BooleanArrayInput: defineAsyncComponent(() => import('components/inputs/BooleanArrayInput')),
    BooleanInput: defineAsyncComponent(() => import('components/inputs/BooleanInput')),
    BytesArrayInput: defineAsyncComponent(() => import('components/inputs/BytesArrayInput')),
    SignedIntInput: defineAsyncComponent(() => import('components/inputs/SignedIntInput')),
    StringArrayInput: defineAsyncComponent(() => import('components/inputs/StringArrayInput')),
    StringInput: defineAsyncComponent(() => import('components/inputs/StringInput')),
    UnsignedIntArrayInput: defineAsyncComponent(() => import('components/inputs/UnsignedIntArrayInput')),
    UnsignedIntInput: defineAsyncComponent(() => import('components/inputs/UnsignedIntInput')),
    SignedIntArrayInput: defineAsyncComponent(() => import('components/inputs/SignedIntArrayInput')),
};

/**
 * Given a function interface type, returns true iff that type is "address"
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsAddress(type) {
    return type === 'address';
}

/**
 * Given a function interface type, returns true iff that type is an array of addresses
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsAddressArray(type) {
    return /^address\[\d*]$/.test(type);
}

/**
 * Given a function interface type, returns true iff that type is boolean
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsBoolean(type) {
    return type === 'bool';
}

/**
 * Given a function interface type, returns true iff that type is a boolean array
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsBooleanArray(type) {
    return /^bool\[\d*]$/.test(type);
}

/**
 * Given a function interface type, returns true iff that type is bytes, e.g. bytes32 or bytes[]
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsBytes(type) {
    return /^bytes/.test(type);
}

/**
 * Given a function interface type, returns true iff that type is signed integer, e.g. int32
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsSignedInt(type) {
    return /^int\d+$/.test(type);
}

/**
 * Given a function interface type, returns true iff that type array of signed integers, e.g. int32[]
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsSignedIntArray(type) {
    return /^int\d+\[\d*]/.test(type);
}

/**
 * Given a function interface type, returns true iff that type is string
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsString(type) {
    return type === 'string';
}

/**
 * Given a function interface type, returns true iff that type is array of string
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsStringArray(type) {
    return /^string\[\d*]$/.test(type);
}

/**
 * Given a function interface type, returns true iff that type represents unsigned integer, e.g. uint32
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsUnsignedInt(type) {
    return /^uint\d+$/.test(type);
}

/**
 * Given a function interface type, returns true iff that type represents unsigned integer array, e.g. uint32[]
 * @param {string} type
 * @returns {boolean}
 */
function parameterTypeIsUnsignedIntArray(type) {
    return /^uint\d+\[\d*]$/.test(type);
}



/**
 * Given a function interface type, returns true iff that type represents an array of any kind, e.g. string[] or uint8[]
 * @param {string} type
 * @returns {boolean}
 */
function parameterIsArrayType(type) {
    return /\[\d*]$/.test(type) || parameterTypeIsBytes(type);
}

/**
 * Given a function interface type, returns true iff that type represents an integer, either signed or unsigned
 * @param {string} type
 * @returns {boolean}
 */
function parameterIsIntegerType(type) {
    return /int\d+$/.test(type);
}

/**
 * Validate integer-size props for input components, e.g. 256 for uint256
 *
 * @param {unknown} prop - the prop to be validated
 * @param {boolean} signed - whether the target integer is signed
 *
 * @return {boolean}
 */
function integerSizeValidator(prop, signed) {
    if (![true, false].includes(signed)) {
        throw 'Invalid parameter - "signed" must be boolean';
    }

    const propIsNumber = Number.isInteger(+prop);
    const propIs8Multiple = +prop % 8 === 0;

    const max = signed ? 128 : 256;
    const propIsInRange = +prop >= 8 && +prop <= max;

    return propIsNumber && propIs8Multiple && propIsInRange;
}


/**
 * Given a function interface input type (e.g. "uint256"), returns true iff the corresponding input component emits
 * new values via the valueParsed event. In these cases, the update:modelValue event (i.e. v-model binding) does not
 * reflect valid values entered by the user; rather, v-model only represents the user-entered string in the input.
 * As such, if this method returns true, only the parsed values given by valueParsed should be considered valid data
 * to pass to a smart contract method.
 *
 * @param type
 * @returns {boolean}
 */
function inputIsComplex(type) {
    return parameterIsIntegerType(type)     ||
        parameterTypeIsAddress(type)        ||
        parameterTypeIsAddressArray(type)   ||
        parameterTypeIsBooleanArray(type)   ||
        parameterTypeIsBytes(type)          ||
        parameterTypeIsSignedIntArray(type) ||
        parameterTypeIsStringArray(type)    ||
        parameterTypeIsUnsignedIntArray(type);
}

/**
 * Given a function interface input type (e.g. "uint256"), returns the corresponding async component for the input
 *
 * @param type
 *
 * @returns {object} asynchronous component definitions
 */
function getComponentForInputType(type) {
    if (parameterTypeIsString(type)) {
        return asyncInputComponents.StringInput;
    } else if (parameterTypeIsStringArray(type)) {
        return asyncInputComponents.StringArrayInput;
    } else if (parameterTypeIsAddress(type)) {
        return asyncInputComponents.AddressInput;
    } else if (parameterTypeIsAddressArray(type)) {
        return asyncInputComponents.AddressArrayInput;
    } else if (parameterTypeIsBoolean(type)) {
        return asyncInputComponents.BooleanInput;
    } else if (parameterTypeIsBooleanArray(type)) {
        return asyncInputComponents.BooleanArrayInput;
    } else if (parameterTypeIsBytes(type)) {
        return asyncInputComponents.BytesArrayInput;
    } else if (parameterTypeIsSignedInt(type)) {
        return asyncInputComponents.SignedIntInput;
    } else if (parameterTypeIsSignedIntArray(type)) {
        return asyncInputComponents.SignedIntArrayInput;
    } else if (parameterTypeIsUnsignedInt(type)) {
        return asyncInputComponents.UnsignedIntInput;
    } else if (parameterTypeIsUnsignedIntArray(type)) {
        return asyncInputComponents.UnsignedIntArrayInput;
    }

    return undefined;
}


/**
 * Given a function interface type, returns the expected size of the array iff it is defined
 * @param {string} type
 * @returns {number|undefined}
 */
function getExpectedArrayLengthFromParameterType(type) {
    if (parameterTypeIsBytes(type)) {
        // defines the length of a bytes array by the first number after "bytes", e.g. 32 in bytes32
        // therefore a type with an array of byte arrays like bytes32[8] is not supported.
        // Only fixed-size byte value types and unbounded bytes arrays are supported
        // see https://docs.soliditylang.org/en/latest/types.html#bytes-and-string-as-arrays
        return (+type.match(/\d+/)?.[0]) || undefined;
    }

    const expectedArrayLengthRegex = /\d+(?=]$)/;
    return (+type.match(expectedArrayLengthRegex)?.[0]) || undefined;
}

/**
 * Given a function interface type, returns the expected number of bits iff the type is an integer (uint or int)
 * @param {string} type
 * @returns {number|undefined}
 */
function getIntegerBits(type) {
    if (!parameterIsIntegerType(type)) {
        return undefined;
    }

    const bitsRegex = /\d+$/;
    return (+type.match(bitsRegex)?.[0]) || undefined;
}

/**
 * Given a string, returns a BigNumber representation of that string iff it represents a solidity unsigned integer
 * and an expected size in bits is supplied
 *
 * @param {string} str - e.g. "12"
 * @param {number} expectedSizeInBits - integer from 8 to 256, must be multiple of 8, e.g. 64 for uint64
 * @returns {BigNumber|undefined}
 */
function parseUintString (str, expectedSizeInBits) {
    const uintStringRegex = /^\d+$/;
    const stringRepresentsValidUint = uintStringRegex.test(str);
    const expectedSizeIsLegal = expectedSizeInBits === undefined || (
        Number.isInteger(expectedSizeInBits) &&
        expectedSizeInBits % 8 === 0 &&
        expectedSizeInBits >= 0 &&
        expectedSizeInBits <= 256
    );

    if (!stringRepresentsValidUint || !expectedSizeIsLegal) {
        return undefined;
    }

    const intBigNumber = BigNumber.from(str);
    const maxValue = BigNumber.from(2).pow(expectedSizeInBits).sub(1);

    let intIsCorrectSize;

    if (expectedSizeInBits === undefined) {
        intIsCorrectSize = true;
    } else {
        intIsCorrectSize = intBigNumber.lte(maxValue);
    }

    return intIsCorrectSize ? intBigNumber : undefined;
}

/**
 * Given a string, returns an array of BigNumbers iff the string represents an array of solidity unsigned integer
 * and an expected size in bits is supplied. Returns undefined if string is valid but has the wrong number of elements
 * in the case of fixed-size arrays
 *
 * @param {string} str - e.g. "[]"
 * @param {number|undefined} expectedLength - optional size of array
 * @param {number} expectedIntSize - integer from 8 to 256, must be multiple of 8, e.g. 64 for uint64
 * @returns {BigNumber[]|undefined}
 */
function parseUintArrayString (str, expectedLength, expectedIntSize) {
    if (str === '[]' && expectedLength === undefined) {
        return [];
    }

    const uintArrayRegex = /^\[(\d+, *)*(\d+)]$/;
    const stringRepresentsUintArray = uintArrayRegex.test(str);
    const expectedSizeIsLegal = expectedIntSize === undefined || (
        Number.isInteger(expectedIntSize) &&
        expectedIntSize % 8 === 0 &&
        expectedIntSize >= 0 &&
        expectedIntSize <= 256
    );

    if (!stringRepresentsUintArray || !expectedSizeIsLegal) {
        return undefined;
    }

    const intStrings = str.match(/\d+/g) ?? [];

    if (expectedLength !== undefined && intStrings.length !== expectedLength) {
        return undefined;
    }

    let intBigNums;

    try {
        intBigNums = intStrings.map(int => BigNumber.from(int));
    } catch {
        return undefined;
    }

    const maxValue = BigNumber.from(2).pow(expectedIntSize).sub(1);
    const allIntsAreValidSize = intBigNums.every(intBigNum => intBigNum.lte(maxValue));

    if (!allIntsAreValidSize) {
        return undefined;
    }

    return intBigNums;
}

/**
 * Given a string, returns a BigNumber representation of that string iff it represents a solidity signed integer
 * and an expected size in bits is supplied
 *
 * @param {string} str - e.g. "12"
 * @param {number} expectedSizeInBits - integer from 8 to 256, must be multiple of 8, e.g. 64 for int64
 * @returns {BigNumber|undefined}
 */
function parseSignedIntString (str, expectedSizeInBits) {
    const signedIntStringRegex = /^-?\d+$/;
    const stringRepresentsValidInt = signedIntStringRegex.test(str);
    const expectedSizeIsLegal = expectedSizeInBits === undefined || (
        Number.isInteger(expectedSizeInBits) &&
        expectedSizeInBits % 8 === 0 &&
        expectedSizeInBits >= 0 &&
        expectedSizeInBits <= 128
    );

    if (!stringRepresentsValidInt || !expectedSizeIsLegal) {
        return undefined;
    }

    const intBigNumber = BigNumber.from(str);
    const maxValue = BigNumber.from(2).pow(expectedSizeInBits).sub(1);
    const minValue = maxValue.mul(-1);

    let intIsCorrectSize;

    if (expectedSizeInBits === undefined) {
        intIsCorrectSize = true;
    } else {
        intIsCorrectSize = intBigNumber.lte(maxValue) && intBigNumber.gte(minValue);
    }


    return intIsCorrectSize ? intBigNumber : undefined;
}

/**
 * Given a string, returns an array of BigNumbers iff the string represents an array of solidity signed integer
 * and an expected size in bits is supplied. Returns undefined if string is valid but has the wrong number of elements
 * in the case of fixed-size arrays
 *
 * @param {string} str - e.g. "[]"
 * @param {number|undefined} expectedLength - optional size of array
 * @param {number} expectedIntSize - integer from 8 to 256, must be multiple of 8, e.g. 64 for int64
 * @returns {BigNumber[]|undefined}
 */
function parseSignedIntArrayString (str, expectedLength, expectedIntSize) {
    if (str === '[]' && expectedLength === undefined) {
        return [];
    }

    const signedIntArrayRegex = /^\[(-?\d+, *)*(-?\d+)]$/;
    const stringRepresentsIntArray = signedIntArrayRegex.test(str);
    const expectedSizeIsLegal = expectedIntSize === undefined || (
        Number.isInteger(expectedIntSize) &&
        expectedIntSize % 8 === 0 &&
        expectedIntSize >= 0 &&
        expectedIntSize <= 128
    );

    if (!stringRepresentsIntArray || !expectedSizeIsLegal) {
        return undefined;
    }

    const intStrings = str.match(/-?\d+/g) ?? [];

    if (expectedLength !== undefined && intStrings.length !== expectedLength) {
        return undefined;
    }

    let intBigNums;

    try {
        intBigNums = intStrings.map(int => BigNumber.from(int));
    } catch {
        return undefined;
    }

    const maxValue = BigNumber.from(2).pow(expectedIntSize).sub(1);
    const minValue = maxValue.mul(-1);
    const allIntsAreValidSize = intBigNums.every(intBigNum => intBigNum.lte(maxValue) && intBigNum.gte(minValue));

    if (!allIntsAreValidSize) {
        return undefined;
    }

    return intBigNums;
}

/**
 * Given a string, returns a formatted address string iff the string is a valid address
 *
 * @param {string} str
 * @returns {string|undefined}
 */
function parseAddressString(str) {
    try {
        return ethers.utils.getAddress(str);
    } catch {
        return undefined;
    }
}

/**
 * Given a string, returns an array of formatted address strings iff the string is a valid representation of an address
 * array. Returns undefined if string is valid but has the wrong number of elements in the case of fixed-size arrays
 *
 * @param {string} str
 * @param {number|undefined} expectedLength
 * @returns {string[]|undefined}
 */
function parseAddressArrayString(str, expectedLength) {
    if (str === '[]' && expectedLength === undefined) {
        return [];
    }

    const arrayOfAddressRegex = /^\[((0x[a-zA-Z0-9]{40}, *)*(0x[a-zA-Z0-9]{40}))]$/;
    const stringRepresentsValidAddressArray = arrayOfAddressRegex.test(str);

    if (!stringRepresentsValidAddressArray) {
        return undefined;
    }

    let addressArray;

    try {
        const addressStringArray = str.match(/0x[a-zA-Z0-9]{40}/g);
        addressArray = addressStringArray.map(addressString => ethers.utils.getAddress(addressString));
    } catch {
        return undefined;
    }

    if (Number.isInteger(expectedLength)) {
        const actualLength = addressArray.length;

        if (actualLength !== expectedLength) {
            return undefined;
        }
    }

    return addressArray;
}

/**
 * Given a string, returns a boolean iff the string is "true" or "false"
 *
 * @param {"true"|"false"} str
 * @returns {boolean|undefined}
 */
function parseBooleanString(str) {
    const trueRegex  = /^true$/i;
    const falseRegex = /^false$/i;

    if (trueRegex.test(str)) {
        return true;
    }

    if (falseRegex.test(str)) {
        return false;
    }

    return undefined;
}

/**
 * Given a string, returns an array of boolean iff the string is a valid representation of a boolean array.
 * Returns undefined if string is valid but has the wrong number of elements in the case of fixed-size arrays
 *
 * @param {string} str - string representation of an array of boolean, e.g. "[true, false, true]"
 * @param {number|undefined} expectedLength
 * @returns {boolean[]|undefined}
 */
function parseBooleanArrayString(str, expectedLength) {
    if (str === '[]' && expectedLength === undefined) {
        return [];
    }

    const booleanArrayStringRegex = /^\[((true|false), *)*(true|false)]$/;

    const stringRepresentValidBoolArray = booleanArrayStringRegex.test(str);
    if (!stringRepresentValidBoolArray) {
        return undefined;
    }

    const booleanRegex = /true|false/g;
    const trueRegex = /true/;
    const boolArray = str.match(booleanRegex).map(bool => trueRegex.test(bool));

    if (Number.isInteger(expectedLength)) {
        const actualLength = boolArray.length;

        if (actualLength !== expectedLength) {
            return undefined;
        }
    }

    return boolArray;
}

/**
 * Given a string, returns an array of string iff it is a valid JSON representation of a string array.
 * Returns undefined if string is valid but has the wrong number of elements in the case of fixed-size arrays
 *
 * @param str - JSON string representation of a string array, e.g. '["neato", "wow", "interesting \"quote\""]'
 * @param expectedLength
 * @returns {string[]|undefined}
 */
function parseStringArrayString(str, expectedLength) {
    let parsedArrayOfStrings;

    try {
        parsedArrayOfStrings = JSON.parse(str);
    } catch {
        return undefined;
    }

    const valueIsArrayOfStrings = Array.isArray(parsedArrayOfStrings) &&
        parsedArrayOfStrings.every(val => typeof val === 'string');

    if (!valueIsArrayOfStrings) {
        return undefined;
    }

    if (Number.isInteger(expectedLength)) {
        const actualLength = parsedArrayOfStrings.length;

        if (actualLength !== expectedLength) {
            return undefined;
        }
    }

    return parsedArrayOfStrings;
}


export {
    parameterIsArrayType,
    parameterIsIntegerType,
    getExpectedArrayLengthFromParameterType,
    getIntegerBits,
    inputIsComplex,
    asyncInputComponents,
    getComponentForInputType,
    integerSizeValidator,

    parameterTypeIsAddress,
    parameterTypeIsAddressArray,
    parameterTypeIsBoolean,
    parameterTypeIsBooleanArray,
    parameterTypeIsBytes,
    parameterTypeIsSignedInt,
    parameterTypeIsSignedIntArray,
    parameterTypeIsString,
    parameterTypeIsStringArray,
    parameterTypeIsUnsignedInt,
    parameterTypeIsUnsignedIntArray,

    parseAddressArrayString,
    parseAddressString,
    parseBooleanArrayString,
    parseBooleanString,
    parseSignedIntArrayString,
    parseSignedIntString,
    parseStringArrayString,
    parseUintArrayString,
    parseUintString,
};
