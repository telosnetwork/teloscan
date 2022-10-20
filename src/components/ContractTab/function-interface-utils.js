import { BigNumber, ethers } from 'ethers';

export function parameterTypeIsImplemented(type) {
    return parameterTypeIsUint256(type)   ||
        parameterTypeIsUint256Array(type) ||
        parameterTypeIsAddress(type)      ||
        parameterTypeIsAddressArray(type) ||
        parameterTypeIsBoolean(type)      ||
        parameterTypeIsBooleanArray(type) ||
        parameterTypeIsString(type);
}

export function parameterTypeIsUint256(type) {
    return type === 'uint256';
}

export function parameterTypeIsUint256Array(type) {
    return /^uint256\[\d*]/.test(type);
}

export function parameterTypeIsAddress(type) {
    return type === 'address';
}

export function parameterTypeIsAddressArray(type) {
    return /^address\[\d*]/.test(type);
}

export function parameterTypeIsBoolean(type) {
    return type === 'bool';
}

export function parameterTypeIsBooleanArray(type) {
    return /^bool\[\d*]/.test(type);
}

export function parameterTypeIsString(type) {
    return type === 'string';
}

export function getExpectedArrayLengthFromParameterType(type) {
    const expectedArrayLengthRegex = /\d+(?=]$)/;
    return (+type.match(expectedArrayLengthRegex)?.[0]) || undefined;
}

export function parseUint256FromString(str = '') {
    const uint256StringRegex = /^\d{1,256}$/;
    const stringRepresentsValidUint256 = uint256StringRegex.test(str);

    if (!stringRepresentsValidUint256) {
        return undefined;
    }

    return BigNumber.from(str);
}

export function parseUint256ArrayString(str = '', expectedLength) {
    if (str === '[]' && expectedLength === undefined)
        return [];

    const arrayOfUint256Regex = /^\[(\d{1,256} *)*(\d{1,256})]$/;
    const stringRepresentsValidUint256Array = arrayOfUint256Regex.test(str);

    if (!stringRepresentsValidUint256Array)
        return undefined;

    const bigNumberArray = str.match(/\d+/g).map(intString => BigNumber.from(intString))

    if (Number.isInteger(expectedLength)) {
        const actualLength = bigNumberArray.length;

        if (actualLength !== expectedLength)
            return undefined;
    }

    return bigNumberArray;
}

export function parseAddressString(str) {
    try {
        return ethers.utils.getAddress(str);
    } catch {
        return undefined;
    }
}

export function parseAddressArrayString(str, expectedLength) {
    if (str === '[]' && expectedLength === undefined)
        return [];

    const arrayOfAddressRegex = /^\[((0x[a-zA-Z0-9]{40} *)*(0x[a-zA-Z0-9]{40}))]$/;
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

export function parseBooleanString(str) {
    const trueRegex  = /^true$/i;
    const falseRegex = /^false$/i;

    if (trueRegex.test(str))
        return true;

    if (falseRegex.test(str))
        return false;

    return undefined;
}

export function parseBooleanArrayString(str, expectedLength) {

    const booleanArrayStringRegex = /^\[((true|false), *)*(true|false)]$/i;

    const stringRepresentValidBoolArray = booleanArrayStringRegex.test(str);
    if (!stringRepresentValidBoolArray)
        return undefined;

    const booleanRegex = /true|false/gi;
    const trueRegex = /true/i;
    const boolArray = str.match(booleanRegex).map(bool => trueRegex.test(bool));

    if (Number.isInteger(expectedLength)) {
        const actualLength = boolArray.length;

        if (actualLength !== expectedLength)
            return undefined;
    }

    return boolArray;
}
