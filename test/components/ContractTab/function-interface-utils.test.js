import {
    getExpectedArrayLengthFromParameterType,
    getIntegerBits,
    inputIsComplex,
    integerSizeValidator,
    parameterIsArrayType,
    parameterIsIntegerType,
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
} from 'components/ContractTab/function-interface-utils';
import { BigNumber } from 'ethers';

describe('function-interface-utils', () => {
    describe('parameterIsArrayType', () => {
        it('should only return true if passed an array type', () => {
            expect(parameterIsArrayType('address')).toBe(false);
            expect(parameterIsArrayType('bool'))   .toBe(false);
            expect(parameterIsArrayType('int128')) .toBe(false);
            expect(parameterIsArrayType('string')) .toBe(false);
            expect(parameterIsArrayType('uint256')).toBe(false);

            expect(parameterIsArrayType('address[1]')) .toBe(true);
            expect(parameterIsArrayType('address[]'))  .toBe(true);
            expect(parameterIsArrayType('bool[3]'))    .toBe(true);
            expect(parameterIsArrayType('bool[]'))     .toBe(true);
            expect(parameterIsArrayType('bytes32'))    .toBe(true);
            expect(parameterIsArrayType('bytes[]'))    .toBe(true);
            expect(parameterIsArrayType('int128[23]')) .toBe(true);
            expect(parameterIsArrayType('int128[]'))   .toBe(true);
            expect(parameterIsArrayType('string[100]')).toBe(true);
            expect(parameterIsArrayType('string[]'))   .toBe(true);
            expect(parameterIsArrayType('uint256[12]')).toBe(true);
            expect(parameterIsArrayType('uint256[]'))  .toBe(true);
        });
    });

    describe('parameterIsIntegerType', () => {
        it('should only return true if passed an integer type', () => {
            expect(parameterIsIntegerType('int128')) .toBe(true);
            expect(parameterIsIntegerType('int8'))   .toBe(true);
            expect(parameterIsIntegerType('uint16')) .toBe(true);
            expect(parameterIsIntegerType('uint256')).toBe(true);

            expect(parameterIsIntegerType('address'))    .toBe(false);
            expect(parameterIsIntegerType('bool'))       .toBe(false);
            expect(parameterIsIntegerType('string'))     .toBe(false);
            expect(parameterIsIntegerType('address[]'))  .toBe(false);
            expect(parameterIsIntegerType('address[1]')) .toBe(false);
            expect(parameterIsIntegerType('bool[]'))     .toBe(false);
            expect(parameterIsIntegerType('bool[3]'))    .toBe(false);
            expect(parameterIsIntegerType('string[]'))   .toBe(false);
            expect(parameterIsIntegerType('string[100]')).toBe(false);
            expect(parameterIsIntegerType('int128[]'))   .toBe(false);
            expect(parameterIsIntegerType('int128[23]')) .toBe(false);
            expect(parameterIsIntegerType('uint256[]'))  .toBe(false);
            expect(parameterIsIntegerType('uint256[12]')).toBe(false);
            expect(parameterIsIntegerType('bytes32'))    .toBe(false);
            expect(parameterIsIntegerType('bytes[]'))    .toBe(false);
        });
    });

    describe('getExpectedArrayLengthFromParameterType', () => {
        it('should return a length iff passed an array type with fixed length', () => {
            expect(getExpectedArrayLengthFromParameterType('address[1]')) .toBe(1);
            expect(getExpectedArrayLengthFromParameterType('bool[3]'))    .toBe(3);
            expect(getExpectedArrayLengthFromParameterType('string[100]')).toBe(100);
            expect(getExpectedArrayLengthFromParameterType('int128[23]')) .toBe(23);
            expect(getExpectedArrayLengthFromParameterType('uint256[12]')).toBe(12);
            expect(getExpectedArrayLengthFromParameterType('bytes32'))    .toBe(32);

            expect(getExpectedArrayLengthFromParameterType('address'))  .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('bool'))     .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('int128'))   .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('string'))   .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('uint256'))  .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('address[]')).toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('bool[]'))   .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('string[]')) .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('int128[]')) .toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('uint256[]')).toBe(undefined);
            expect(getExpectedArrayLengthFromParameterType('bytes[]'))  .toBe(undefined);
        });
    });

    describe('getIntegerBits', () => {
        it('should return a number of bits iff passed an integer type', () => {
            expect(getIntegerBits('uint256')).toBe(256);
            expect(getIntegerBits('int128')) .toBe(128);
            expect(getIntegerBits('int8'))   .toBe(8);

            expect(getIntegerBits('address'))    .toBe(undefined);
            expect(getIntegerBits('bool'))       .toBe(undefined);
            expect(getIntegerBits('string'))     .toBe(undefined);
            expect(getIntegerBits('address[]'))  .toBe(undefined);
            expect(getIntegerBits('address[1]')) .toBe(undefined);
            expect(getIntegerBits('bool[]'))     .toBe(undefined);
            expect(getIntegerBits('bool[3]'))    .toBe(undefined);
            expect(getIntegerBits('string[]'))   .toBe(undefined);
            expect(getIntegerBits('string[100]')).toBe(undefined);
            expect(getIntegerBits('int128[]'))   .toBe(undefined);
            expect(getIntegerBits('int128[23]')) .toBe(undefined);
            expect(getIntegerBits('uint256[]'))  .toBe(undefined);
            expect(getIntegerBits('uint256[12]')).toBe(undefined);
            expect(getIntegerBits('bytes32'))    .toBe(undefined);
            expect(getIntegerBits('bytes[]'))    .toBe(undefined);
        });
    });

    describe('inputIsComplex', () => {
        // eslint-disable-next-line max-len
        it('should only return true for types for which the corresponding component emits the parsedValue event', () => {
            expect(inputIsComplex('string'))     .toBe(false);
            expect(inputIsComplex('bool'))       .toBe(false);

            expect(inputIsComplex('address'))    .toBe(true);
            expect(inputIsComplex('address[1]')) .toBe(true);
            expect(inputIsComplex('address[]'))  .toBe(true);
            expect(inputIsComplex('bool[3]'))    .toBe(true);
            expect(inputIsComplex('bool[]'))     .toBe(true);
            expect(inputIsComplex('bytes32'))    .toBe(true);
            expect(inputIsComplex('bytes[]'))    .toBe(true);
            expect(inputIsComplex('int128'))     .toBe(true);
            expect(inputIsComplex('int128[23]')) .toBe(true);
            expect(inputIsComplex('int128[]'))   .toBe(true);
            expect(inputIsComplex('string[100]')).toBe(true);
            expect(inputIsComplex('string[]'))   .toBe(true);
            expect(inputIsComplex('uint256'))    .toBe(true);
            expect(inputIsComplex('uint256[12]')).toBe(true);
            expect(inputIsComplex('uint256[]'))  .toBe(true);
        });
    });

    describe('integerSizeValidator', () => {
        describe('should correctly validate a size prop for', () => {
            test('signed integers', () => {
                expect(integerSizeValidator('8', true)).toBe(true);
                expect(integerSizeValidator(8, true)).toBe(true);
                expect(integerSizeValidator('128', true)).toBe(true);
                expect(integerSizeValidator(128, true)).toBe(true);

                expect(integerSizeValidator('-8', true)).toBe(false);
                expect(integerSizeValidator(-8, true)).toBe(false);
                expect(integerSizeValidator('256', true)).toBe(false);
                expect(integerSizeValidator(256, true)).toBe(false);
                expect(integerSizeValidator('abc', true)).toBe(false);
            });

            test('unsigned integers', () => {
                expect(integerSizeValidator('8', false)).toBe(true);
                expect(integerSizeValidator(8, false)).toBe(true);
                expect(integerSizeValidator('128', false)).toBe(true);
                expect(integerSizeValidator(128, false)).toBe(true);
                expect(integerSizeValidator('256', false)).toBe(true);
                expect(integerSizeValidator(256, false)).toBe(true);

                expect(integerSizeValidator('800', false)).toBe(false);
                expect(integerSizeValidator('-800', false)).toBe(false);
                expect(integerSizeValidator('-8', false)).toBe(false);
                expect(integerSizeValidator(-8, false)).toBe(false);
                expect(integerSizeValidator('abc', false)).toBe(false);
            });
        });
    });

    describe('parameterTypeIsAddress', () => {
        it('should only return true if type === "address"', () => {
            expect(parameterTypeIsAddress('address')).toBe(true);

            expect(parameterTypeIsAddress('address[1]')) .toBe(false);
            expect(parameterTypeIsAddress('address[]'))  .toBe(false);
            expect(parameterTypeIsAddress('bool'))       .toBe(false);
            expect(parameterTypeIsAddress('bool[3]'))    .toBe(false);
            expect(parameterTypeIsAddress('bool[]'))     .toBe(false);
            expect(parameterTypeIsAddress('bytes32'))    .toBe(false);
            expect(parameterTypeIsAddress('bytes[]'))    .toBe(false);
            expect(parameterTypeIsAddress('int128'))     .toBe(false);
            expect(parameterTypeIsAddress('int128[23]')) .toBe(false);
            expect(parameterTypeIsAddress('int128[]'))   .toBe(false);
            expect(parameterTypeIsAddress('string'))     .toBe(false);
            expect(parameterTypeIsAddress('string[100]')).toBe(false);
            expect(parameterTypeIsAddress('string[]'))   .toBe(false);
            expect(parameterTypeIsAddress('uint256'))    .toBe(false);
            expect(parameterTypeIsAddress('uint256[12]')).toBe(false);
            expect(parameterTypeIsAddress('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsAddressArray', () => {
        it('should only return true if type is an address array', () => {
            expect(parameterTypeIsAddressArray('address[]'))  .toBe(true);
            expect(parameterTypeIsAddressArray('address[1]')) .toBe(true);

            expect(parameterTypeIsAddressArray('address'))    .toBe(false);
            expect(parameterTypeIsAddressArray('bool'))       .toBe(false);
            expect(parameterTypeIsAddressArray('bool[3]'))    .toBe(false);
            expect(parameterTypeIsAddressArray('bool[]'))     .toBe(false);
            expect(parameterTypeIsAddressArray('bytes32'))    .toBe(false);
            expect(parameterTypeIsAddressArray('bytes[]'))    .toBe(false);
            expect(parameterTypeIsAddressArray('int128'))     .toBe(false);
            expect(parameterTypeIsAddressArray('int128[23]')) .toBe(false);
            expect(parameterTypeIsAddressArray('int128[]'))   .toBe(false);
            expect(parameterTypeIsAddressArray('string'))     .toBe(false);
            expect(parameterTypeIsAddressArray('string[100]')).toBe(false);
            expect(parameterTypeIsAddressArray('string[]'))   .toBe(false);
            expect(parameterTypeIsAddressArray('uint256'))    .toBe(false);
            expect(parameterTypeIsAddressArray('uint256[12]')).toBe(false);
            expect(parameterTypeIsAddressArray('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsBoolean', () => {
        it('should only return true if type is boolean', () => {
            expect(parameterTypeIsBoolean('bool'))       .toBe(true);

            expect(parameterTypeIsBoolean('address[]'))  .toBe(false);
            expect(parameterTypeIsBoolean('address[1]')) .toBe(false);
            expect(parameterTypeIsBoolean('address'))    .toBe(false);
            expect(parameterTypeIsBoolean('bool[3]'))    .toBe(false);
            expect(parameterTypeIsBoolean('bool[]'))     .toBe(false);
            expect(parameterTypeIsBoolean('bytes32'))    .toBe(false);
            expect(parameterTypeIsBoolean('bytes[]'))    .toBe(false);
            expect(parameterTypeIsBoolean('int128'))     .toBe(false);
            expect(parameterTypeIsBoolean('int128[23]')) .toBe(false);
            expect(parameterTypeIsBoolean('int128[]'))   .toBe(false);
            expect(parameterTypeIsBoolean('string'))     .toBe(false);
            expect(parameterTypeIsBoolean('string[100]')).toBe(false);
            expect(parameterTypeIsBoolean('string[]'))   .toBe(false);
            expect(parameterTypeIsBoolean('uint256'))    .toBe(false);
            expect(parameterTypeIsBoolean('uint256[12]')).toBe(false);
            expect(parameterTypeIsBoolean('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsBooleanArray', () => {
        it('should only return true if type is a boolean array', () => {
            expect(parameterTypeIsBooleanArray('bool[3]'))    .toBe(true);
            expect(parameterTypeIsBooleanArray('bool[]'))     .toBe(true);

            expect(parameterTypeIsBooleanArray('address[]'))  .toBe(false);
            expect(parameterTypeIsBooleanArray('address[1]')) .toBe(false);
            expect(parameterTypeIsBooleanArray('address'))    .toBe(false);
            expect(parameterTypeIsBooleanArray('bool'))       .toBe(false);
            expect(parameterTypeIsBooleanArray('bytes32'))    .toBe(false);
            expect(parameterTypeIsBooleanArray('bytes[]'))    .toBe(false);
            expect(parameterTypeIsBooleanArray('int128'))     .toBe(false);
            expect(parameterTypeIsBooleanArray('int128[23]')) .toBe(false);
            expect(parameterTypeIsBooleanArray('int128[]'))   .toBe(false);
            expect(parameterTypeIsBooleanArray('string'))     .toBe(false);
            expect(parameterTypeIsBooleanArray('string[100]')).toBe(false);
            expect(parameterTypeIsBooleanArray('string[]'))   .toBe(false);
            expect(parameterTypeIsBooleanArray('uint256'))    .toBe(false);
            expect(parameterTypeIsBooleanArray('uint256[12]')).toBe(false);
            expect(parameterTypeIsBooleanArray('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsBytes', () => {
        it('should only return true if type is bytes', () => {
            expect(parameterTypeIsBytes('bytes32'))    .toBe(true);
            expect(parameterTypeIsBytes('bytes[]'))    .toBe(true);

            expect(parameterTypeIsBytes('address[]'))  .toBe(false);
            expect(parameterTypeIsBytes('address[1]')) .toBe(false);
            expect(parameterTypeIsBytes('address'))    .toBe(false);
            expect(parameterTypeIsBytes('bool'))       .toBe(false);
            expect(parameterTypeIsBytes('bool[3]'))    .toBe(false);
            expect(parameterTypeIsBytes('bool[]'))     .toBe(false);
            expect(parameterTypeIsBytes('int128'))     .toBe(false);
            expect(parameterTypeIsBytes('int128[23]')) .toBe(false);
            expect(parameterTypeIsBytes('int128[]'))   .toBe(false);
            expect(parameterTypeIsBytes('string'))     .toBe(false);
            expect(parameterTypeIsBytes('string[100]')).toBe(false);
            expect(parameterTypeIsBytes('string[]'))   .toBe(false);
            expect(parameterTypeIsBytes('uint256'))    .toBe(false);
            expect(parameterTypeIsBytes('uint256[12]')).toBe(false);
            expect(parameterTypeIsBytes('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsSignedInt', () => {
        it('should only return true if type is a signed int', () => {
            expect(parameterTypeIsSignedInt('int128'))     .toBe(true);

            expect(parameterTypeIsSignedInt('address'))    .toBe(false);
            expect(parameterTypeIsSignedInt('address[1]')) .toBe(false);
            expect(parameterTypeIsSignedInt('address[]'))  .toBe(false);
            expect(parameterTypeIsSignedInt('bool'))       .toBe(false);
            expect(parameterTypeIsSignedInt('bool[3]'))    .toBe(false);
            expect(parameterTypeIsSignedInt('bool[]'))     .toBe(false);
            expect(parameterTypeIsSignedInt('bytes32'))    .toBe(false);
            expect(parameterTypeIsSignedInt('bytes[]'))    .toBe(false);
            expect(parameterTypeIsSignedInt('int128[23]')) .toBe(false);
            expect(parameterTypeIsSignedInt('int128[]'))   .toBe(false);
            expect(parameterTypeIsSignedInt('string'))     .toBe(false);
            expect(parameterTypeIsSignedInt('string[100]')).toBe(false);
            expect(parameterTypeIsSignedInt('string[]'))   .toBe(false);
            expect(parameterTypeIsSignedInt('uint256'))    .toBe(false);
            expect(parameterTypeIsSignedInt('uint256[12]')).toBe(false);
            expect(parameterTypeIsSignedInt('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsSignedIntArray', () => {
        it('should only return true if type is a signed int array', () => {
            expect(parameterTypeIsSignedIntArray('int128[23]')) .toBe(true);
            expect(parameterTypeIsSignedIntArray('int128[]'))   .toBe(true);

            expect(parameterTypeIsSignedIntArray('address'))    .toBe(false);
            expect(parameterTypeIsSignedIntArray('address[1]')) .toBe(false);
            expect(parameterTypeIsSignedIntArray('address[]'))  .toBe(false);
            expect(parameterTypeIsSignedIntArray('bool'))       .toBe(false);
            expect(parameterTypeIsSignedIntArray('bool[3]'))    .toBe(false);
            expect(parameterTypeIsSignedIntArray('bool[]'))     .toBe(false);
            expect(parameterTypeIsSignedIntArray('bytes32'))    .toBe(false);
            expect(parameterTypeIsSignedIntArray('bytes[]'))    .toBe(false);
            expect(parameterTypeIsSignedIntArray('int128'))     .toBe(false);
            expect(parameterTypeIsSignedIntArray('string'))     .toBe(false);
            expect(parameterTypeIsSignedIntArray('string[100]')).toBe(false);
            expect(parameterTypeIsSignedIntArray('string[]'))   .toBe(false);
            expect(parameterTypeIsSignedIntArray('uint256'))    .toBe(false);
            expect(parameterTypeIsSignedIntArray('uint256[12]')).toBe(false);
            expect(parameterTypeIsSignedIntArray('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsString', () => {
        it('should only return true if type is string', () => {
            expect(parameterTypeIsString('string'))     .toBe(true);

            expect(parameterTypeIsString('address'))    .toBe(false);
            expect(parameterTypeIsString('address[1]')) .toBe(false);
            expect(parameterTypeIsString('address[]'))  .toBe(false);
            expect(parameterTypeIsString('bool'))       .toBe(false);
            expect(parameterTypeIsString('bool[3]'))    .toBe(false);
            expect(parameterTypeIsString('bool[]'))     .toBe(false);
            expect(parameterTypeIsString('bytes32'))    .toBe(false);
            expect(parameterTypeIsString('bytes[]'))    .toBe(false);
            expect(parameterTypeIsString('int128'))     .toBe(false);
            expect(parameterTypeIsString('int128[23]')) .toBe(false);
            expect(parameterTypeIsString('int128[]'))   .toBe(false);
            expect(parameterTypeIsString('string[100]')).toBe(false);
            expect(parameterTypeIsString('string[]'))   .toBe(false);
            expect(parameterTypeIsString('uint256'))    .toBe(false);
            expect(parameterTypeIsString('uint256[12]')).toBe(false);
            expect(parameterTypeIsString('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsStringArray', () => {
        it('should only return true if type is a string array', () => {
            expect(parameterTypeIsStringArray('string[100]')).toBe(true);
            expect(parameterTypeIsStringArray('string[]'))   .toBe(true);

            expect(parameterTypeIsStringArray('address'))    .toBe(false);
            expect(parameterTypeIsStringArray('address[1]')) .toBe(false);
            expect(parameterTypeIsStringArray('address[]'))  .toBe(false);
            expect(parameterTypeIsStringArray('bool'))       .toBe(false);
            expect(parameterTypeIsStringArray('bool[3]'))    .toBe(false);
            expect(parameterTypeIsStringArray('bool[]'))     .toBe(false);
            expect(parameterTypeIsStringArray('bytes32'))    .toBe(false);
            expect(parameterTypeIsStringArray('bytes[]'))    .toBe(false);
            expect(parameterTypeIsStringArray('int128'))     .toBe(false);
            expect(parameterTypeIsStringArray('int128[23]')) .toBe(false);
            expect(parameterTypeIsStringArray('int128[]'))   .toBe(false);
            expect(parameterTypeIsStringArray('string'))     .toBe(false);
            expect(parameterTypeIsStringArray('uint256'))    .toBe(false);
            expect(parameterTypeIsStringArray('uint256[12]')).toBe(false);
            expect(parameterTypeIsStringArray('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsUnsignedInt', () => {
        it('should only return true if type is unsigned int', () => {
            expect(parameterTypeIsUnsignedInt('uint256'))    .toBe(true);

            expect(parameterTypeIsUnsignedInt('address'))    .toBe(false);
            expect(parameterTypeIsUnsignedInt('address[1]')) .toBe(false);
            expect(parameterTypeIsUnsignedInt('address[]'))  .toBe(false);
            expect(parameterTypeIsUnsignedInt('bool'))       .toBe(false);
            expect(parameterTypeIsUnsignedInt('bool[3]'))    .toBe(false);
            expect(parameterTypeIsUnsignedInt('bool[]'))     .toBe(false);
            expect(parameterTypeIsUnsignedInt('bytes32'))    .toBe(false);
            expect(parameterTypeIsUnsignedInt('bytes[]'))    .toBe(false);
            expect(parameterTypeIsUnsignedInt('int128'))     .toBe(false);
            expect(parameterTypeIsUnsignedInt('int128[23]')) .toBe(false);
            expect(parameterTypeIsUnsignedInt('int128[]'))   .toBe(false);
            expect(parameterTypeIsUnsignedInt('string'))     .toBe(false);
            expect(parameterTypeIsUnsignedInt('string[100]')).toBe(false);
            expect(parameterTypeIsUnsignedInt('string[]'))   .toBe(false);
            expect(parameterTypeIsUnsignedInt('uint256[12]')).toBe(false);
            expect(parameterTypeIsUnsignedInt('uint256[]'))  .toBe(false);
        });
    });

    describe('parameterTypeIsUnsignedIntArray', () => {
        it('should only return true if type is an unsigned int array', () => {
            expect(parameterTypeIsUnsignedIntArray('uint256[12]')).toBe(true);
            expect(parameterTypeIsUnsignedIntArray('uint256[]'))  .toBe(true);

            expect(parameterTypeIsUnsignedIntArray('address'))    .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('address[1]')) .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('address[]'))  .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('bool'))       .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('bool[3]'))    .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('bool[]'))     .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('bytes32'))    .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('bytes[]'))    .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('int128'))     .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('int128[23]')) .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('int128[]'))   .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('string'))     .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('string[100]')).toBe(false);
            expect(parameterTypeIsUnsignedIntArray('string[]'))   .toBe(false);
            expect(parameterTypeIsUnsignedIntArray('uint256'))    .toBe(false);
        });
    });

    describe('parseAddressArrayString', () => {
        it('should correctly parse a string representation of address array', () => {
            const addressOne = `0x${'0'.repeat(40)}`;
            const addressTwo = `0x${'1'.repeat(40)}`;

            // any length - valid
            expect(parseAddressArrayString('[]')).toEqual([]);
            expect(parseAddressArrayString(`[${addressOne}]`)).toEqual([addressOne]);
            expect(parseAddressArrayString(`[${addressOne}, ${addressTwo}]`)).toEqual([addressOne, addressTwo]);

            // any length - invalid
            expect(parseAddressArrayString('[1]')).toEqual(undefined);


            // fixed length - valid
            expect(parseAddressArrayString(`[${addressOne}]`, 1)).toEqual([addressOne]);
            expect(parseAddressArrayString(`[${addressOne}, ${addressTwo}]`, 2)).toEqual([addressOne, addressTwo]);

            // fixed length - invalid
            expect(parseAddressArrayString('[]', 2)).toEqual(undefined);
            expect(parseAddressArrayString(`[${addressOne}]`, 2)).toEqual(undefined);
        });
    });

    describe('parseAddressString', () => {
        it('should parse an address correctly', () => {
            const address = `0x${'0'.repeat(40)}`;
            const badAddress = `0x${'0'.repeat(39)}`;

            expect(parseAddressString(address)).toBe(address);
            expect(parseAddressString(badAddress)).toBe(undefined);
        });
    });

    describe('parseBooleanArrayString', () => {
        it('should correctly parse a string representation of boolean array', () => {
            // any length - valid
            expect(parseBooleanArrayString('[]')).toEqual([]);
            expect(parseBooleanArrayString('[true]')).toEqual([true]);
            expect(parseBooleanArrayString('[true, false]')).toEqual([true, false]);

            // any length - invalid
            expect(parseBooleanArrayString('[1]')).toEqual(undefined);


            // fixed length - valid
            expect(parseBooleanArrayString('[true]', 1)).toEqual([true]);
            expect(parseBooleanArrayString('[true, false]', 2)).toEqual([true, false]);

            // fixed length - invalid
            expect(parseBooleanArrayString('[]', 2)).toEqual(undefined);
            expect(parseBooleanArrayString('[false]', 2)).toEqual(undefined);
        });
    });

    describe('parseBooleanString', () => {
        it('should parse a string representation of a boolean correctly', () => {
            expect(parseBooleanString('false')).toBe(false);
            expect(parseBooleanString('False')).toBe(false);
            expect(parseBooleanString('FAlSE')).toBe(false);
            expect(parseBooleanString('true')).toBe(true);
            expect(parseBooleanString('True')).toBe(true);
            expect(parseBooleanString('TRUE')).toBe(true);

            expect(parseBooleanString('fals')).toBe(undefined);
            expect(parseBooleanString(3)).toBe(undefined);
        });
    });

    describe('parseSignedIntArrayString', () => {
        it('should correctly parse a string representation of signed int array', () => {
            const intOne = 1;
            const intTwo = 3;

            const intOneBn = BigNumber.from(intOne);
            const intTwoBn = BigNumber.from(intTwo);

            // any length - valid
            expect(parseSignedIntArrayString('[]')).toEqual([]);
            expect(parseSignedIntArrayString(`[${intOne}]`, undefined, 8)).toEqual([intOneBn]);
            expect(parseSignedIntArrayString(`[${intOne}, ${intTwo}]`, undefined, 8)).toEqual([intOneBn, intTwoBn]);
            expect(parseSignedIntArrayString('[-1]', undefined, 8)).toEqual([BigNumber.from(-1)]);

            // any length - invalid
            expect(parseSignedIntArrayString('[xy]', undefined, 8)).toEqual(undefined);
            expect(parseSignedIntArrayString('[123456789]', undefined, 8)).toEqual(undefined); // to large for 8 bits


            // fixed length - valid
            expect(parseSignedIntArrayString(`[${intOne}]`, 1, 8)).toEqual([intOneBn]);
            expect(parseSignedIntArrayString(`[${intOne}, ${intTwo}]`, 2, 8)).toEqual([intOneBn, intTwoBn]);

            // fixed length - invalid
            expect(parseSignedIntArrayString('[]', 2, 8)).toEqual(undefined);
            expect(parseSignedIntArrayString(`[${intOne}]`, 2, 8)).toEqual(undefined);
        });
    });

    describe('parseSignedIntString', () => {
        it('should correctly parse a string representation of a signed int', () => {
            const intOne = '1';
            const intTwo = '-1';

            const intOneBn = BigNumber.from(intOne);
            const intTwoBn = BigNumber.from(intTwo);

            expect(parseSignedIntString(intOne, 8)).toEqual(intOneBn);
            expect(parseSignedIntString(intTwo, 8)).toEqual(intTwoBn);


            expect(parseSignedIntString('abc', 8)).toEqual(undefined);
            expect(parseSignedIntString('123456', 8)).toEqual(undefined); // too large for 8 bits
        });
    });

    describe('parseStringArrayString', () => {
        it('should correctly parse a string representation of an array of strings', () => {
            // any length - valid
            expect(parseStringArrayString('[]')).toEqual([]);
            expect(parseStringArrayString('["test"]')).toEqual(['test']);
            expect(parseStringArrayString('["test", "some other \\"test\\""]')).toEqual(['test', 'some other "test"']);

            // any length - invalid
            expect(parseStringArrayString('[1]')).toEqual(undefined);


            // fixed length - valid
            expect(parseStringArrayString('["test"]', 1)).toEqual(['test']);
            expect(parseStringArrayString('["test", "some other \\"test\\""]', 2))
                .toEqual(['test', 'some other "test"']);

            // fixed length - invalid
            expect(parseStringArrayString('[]', 2)).toEqual(undefined);
            expect(parseStringArrayString('["test"]', 2)).toEqual(undefined);
        });
    });

    describe('parseUintArrayString', () => {
        it('should correctly parse a string representation of unsigned int array', () => {
            const intOne = 1;
            const intTwo = 3;

            const intOneBn = BigNumber.from(intOne);
            const intTwoBn = BigNumber.from(intTwo);

            // any length - valid
            expect(parseUintArrayString('[]')).toEqual([]);
            expect(parseUintArrayString(`[${intOne}]`, undefined, 8)).toEqual([intOneBn]);
            expect(parseUintArrayString(`[${intOne}, ${intTwo}]`, undefined, 8)).toEqual([intOneBn, intTwoBn]);

            // any length - invalid
            expect(parseUintArrayString('[xy]', undefined, 8)).toEqual(undefined);
            expect(parseUintArrayString('[123456789]', undefined, 8)).toEqual(undefined); // to large for 8 bits
            expect(parseUintArrayString('[-1]', undefined, 8)).toEqual(undefined);


            // fixed length - valid
            expect(parseUintArrayString(`[${intOne}]`, 1, 8)).toEqual([intOneBn]);
            expect(parseUintArrayString(`[${intOne}, ${intTwo}]`, 2, 8)).toEqual([intOneBn, intTwoBn]);

            // fixed length - invalid
            expect(parseUintArrayString('[]', 2, 8)).toEqual(undefined);
            expect(parseUintArrayString(`[${intOne}]`, 2, 8)).toEqual(undefined);
        });
    });

    describe('parseUintString', () => {
        it('should correctly parse a string representation of an unsigned int', () => {
            const intOne = '1';
            const intOneBn = BigNumber.from(intOne);

            expect(parseUintString(intOne, 8)).toEqual(intOneBn);

            expect(parseUintString('abc', 8)).toEqual(undefined);
            expect(parseUintString('123456', 8)).toEqual(undefined); // too large for 8 bits
            expect(parseUintString('-3', 8)).toEqual(undefined); // no signed ints
        });
    });
});
