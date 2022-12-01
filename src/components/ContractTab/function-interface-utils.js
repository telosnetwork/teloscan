import { BigNumber, ethers } from 'ethers';

function parameterTypeIsImplemented(type) {
    return parameterTypeIsUint256(type)   ||
        parameterTypeIsUint256Array(type) ||
        parameterTypeIsAddress(type)      ||
        parameterTypeIsAddressArray(type) ||
        parameterTypeIsBoolean(type)      ||
        parameterTypeIsBooleanArray(type) ||
        parameterTypeIsString(type);
}

function parameterTypeIsUint256(type) {
    return type === 'uint256';
}

function parameterTypeIsUint256Array(type) {
    return /^uint256\[\d*]/.test(type);
}

function parameterTypeIsAddress(type) {
    return type === 'address';
}

function parameterTypeIsAddressArray(type) {
    return /^address\[\d*]/.test(type);
}

function parameterTypeIsBoolean(type) {
    return type === 'bool';
}

function parameterTypeIsBooleanArray(type) {
    return /^bool\[\d*]/.test(type);
}

function parameterTypeIsString(type) {
    return type === 'string';
}

function parameterTypeIsStringArray(type) {
    return /^string\[\d*]/.test(type);
}

function getExpectedArrayLengthFromParameterType(type) {
    const expectedArrayLengthRegex = /\d+(?=]$)/;
    return (+type.match(expectedArrayLengthRegex)?.[0]) || undefined;
}

// eztodo deprecated and incorrect; remove
function parseUint256String(str = '') {
    const uint256StringRegex = /^\d{1,256}$/;
    const stringRepresentsValidUint256 = uint256StringRegex.test(str);

    if (!stringRepresentsValidUint256) {
        return undefined;
    }

    return BigNumber.from(str);
}

// eztodo deprecated and incorrect; remove
function parseUint256ArrayString(str = '', expectedLength) {
    if (str === '[]' && expectedLength === undefined)
        return [];

    const arrayOfUint256Regex = /^\[(\d{1,256}, *)*(\d{1,256})]$/;
    const stringRepresentsValidUint256Array = arrayOfUint256Regex.test(str);

    if (!stringRepresentsValidUint256Array)
        return undefined;

    const bigNumberArray = str.match(/\d+/g).map(intString => BigNumber.from(intString));

    if (Number.isInteger(expectedLength)) {
        const actualLength = bigNumberArray.length;

        if (actualLength !== expectedLength)
            return undefined;
    }

    return bigNumberArray;
}





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

function parseUintArrayString (str, expectedLength, expectedIntSize) {
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
        intBigNums = intStrings.map(int => BigNumber.from(int))
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

function parseSignedIntArrayString (str, expectedLength, expectedIntSize) {
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
        intBigNums = intStrings.map(int => BigNumber.from(int))
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






function parseAddressString(str) {
    try {
        return ethers.utils.getAddress(str);
    } catch {
        return undefined;
    }
}

function parseAddressArrayString(str, expectedLength) {
    if (str === '[]' && expectedLength === undefined)
        return [];

    const arrayOfAddressRegex = /^\[((0x[a-zA-Z0-9]{40}, *)*(0x[a-zA-Z0-9]{40}))]$/;
    const stringRepresentsValidAddressArray = arrayOfAddressRegex.test(str);

    if (!stringRepresentsValidAddressArray)
        return undefined;

    let addressArray;

    try {
        const addressStringArray = str.match(/0x[a-zA-Z0-9]{40}/g);
        addressArray = addressStringArray.map(addressString => ethers.utils.getAddress(addressString));
    } catch {
        return undefined;
    }

    if (Number.isInteger(expectedLength)) {
        const actualLength = addressArray.length;

        if (actualLength !== expectedLength)
            return undefined;
    }

    return addressArray;
}

function parseBooleanString(str) {
    const trueRegex  = /^true$/i;
    const falseRegex = /^false$/i;

    if (trueRegex.test(str))
        return true;

    if (falseRegex.test(str))
        return false;

    return undefined;
}

function parseBooleanArrayString(str, expectedLength) {
    if (str === '[]' && expectedLength === undefined)
        return [];

    const booleanArrayStringRegex = /^\[((true|false), *)*(true|false)]$/;

    const stringRepresentValidBoolArray = booleanArrayStringRegex.test(str);
    if (!stringRepresentValidBoolArray)
        return undefined;

    const booleanRegex = /true|false/g;
    const trueRegex = /true/;
    const boolArray = str.match(booleanRegex).map(bool => trueRegex.test(bool));

    if (Number.isInteger(expectedLength)) {
        const actualLength = boolArray.length;

        if (actualLength !== expectedLength)
            return undefined;
    }

    return boolArray;
}

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

        if (actualLength !== expectedLength)
            return undefined;
    }

    return parsedArrayOfStrings;
}


export {
    getExpectedArrayLengthFromParameterType,

    parameterTypeIsAddress,
    parameterTypeIsAddressArray,
    parameterTypeIsBoolean,
    parameterTypeIsBooleanArray,
    parameterTypeIsImplemented,
    parameterTypeIsString,
    parameterTypeIsStringArray,
    parameterTypeIsUint256,
    parameterTypeIsUint256Array,

    parseAddressArrayString,
    parseAddressString,
    parseBooleanArrayString,
    parseBooleanString,
    parseSignedIntArrayString,
    parseSignedIntString,
    parseStringArrayString,
    parseUintArrayString,
    parseUintString,

    // eztodo yeet
    parseUint256ArrayString,
    parseUint256String,
}
