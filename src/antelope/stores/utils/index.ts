export * from 'src/antelope/stores/utils/abi/signature';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { EvmABIEntry } from 'src/antelope/types';
import { toStringNumber } from 'src/antelope/stores/utils/currency-utils';
import { prettyPrintCurrency } from 'src/antelope/stores/utils/currency-utils';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

const REVERT_FUNCTION_SELECTOR = '0x08c379a0';
const REVERT_PANIC_SELECTOR = '0x4e487b71';

export const PRICE_UPDATE_INTERVAL_IN_MIN = 30;
export const WEI_PRECISION = 18;

/**
 * divideFloat performs a division of two float numbers represented as strings or native numbers.
 * @param a is the numerator expressed as a number or a string representing a number (e.g. '100000000002', '1.5' or '0.000000000000000001')
 * @param b is the denominator expressed as a number or a string representing a number
 * @returns a string representing the result of the division also as a float number
 */
export function divideFloat(a: string | number, b: string | number): string {
    const a_str = toStringNumber(a);
    const b_str = toStringNumber(b);
    const a_decimals = a_str.split('.')[1] ? a_str.split('.')[1].length : 0;
    const b_decimals = b_str.split('.')[1] ? b_str.split('.')[1].length : 0;
    const decimals = 2 * Math.max(a_decimals, b_decimals);
    const A = ethers.utils.parseUnits(a_str, decimals);
    const B = ethers.utils.parseUnits(b_str, b_decimals);
    const result = A.div(B);
    return formatUnits(result.toString(), decimals-b_decimals);
}

/**
 * multiplyFloat performs a multiplication of two float numbers represented as strings or native numbers.
 * @param a is the first factor expressed as a number or a string representing a number (e.g. '100000000002', '1.5' or '0.000000000000000001')
 * @param b is the second factor expressed as a number or a string representing a number
 * @returns a string representing the result of the multiplication also as a float number
 */
export function multiplyFloat(a: string | number, b: string | number): string {
    const a_str = toStringNumber(a);
    const b_str = toStringNumber(b);
    const a_decimals = a_str.split('.')[1] ? a_str.split('.')[1].length : 0;
    const b_decimals = b_str.split('.')[1] ? b_str.split('.')[1].length : 0;
    const decimals = a_decimals + b_decimals;
    const A = ethers.utils.parseUnits(a_str, decimals);
    const B = ethers.utils.parseUnits(b_str, decimals);
    const result = A.mul(B);
    return formatUnits(result.toString(), decimals+decimals);
}

export function formatWei(bn: string | number | ethers.BigNumber, tokenDecimals: number, displayDecimals = 4): string {
    const amount = ethers.BigNumber.from(bn);
    const formatted = formatUnits(amount.toString(), tokenDecimals || WEI_PRECISION);
    const str = formatted.toString();
    // Use string, do not convert to number so we never lose precision
    if (displayDecimals > 0 && str.includes('.')) {
        const parts = str.split('.');
        return parts[0] + '.' + parts[1].slice(0, displayDecimals);
    }
    return str;
}

export function isValidAddressFormat(ethAddressString: string): boolean {
    const pattern = /^0x[a-fA-F0-9]{40}$/;
    return pattern.test(ethAddressString);
}

export function getTopicHash(topic: string): string {
    return `0x${topic.substring(topic.length - 40)}`;
}

export function toChecksumAddress(address: string): string {
    if (!address) {
        return address;
    }

    let addy = address.toLowerCase().replace('0x', '');
    if (addy.length !== 40) {
        addy = addy.padStart(40, '0');
    }

    const hash = keccak256(toUtf8Bytes(addy)).replace('0x', '');
    let ret = '0x';

    for (let i = 0; i < addy.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += addy[i].toUpperCase();
        } else {
            ret += addy[i];
        }
    }

    return ret;
}

export function parseErrorMessage(output: string): string {
    if (!output) {
        return '';
    }

    let message = '';
    if (output.startsWith(REVERT_FUNCTION_SELECTOR)) {
        message = parseRevertReason(output);
    }

    if (output.startsWith(REVERT_PANIC_SELECTOR)) {
        message = parsePanicReason(output);
    }

    return message.replace(/[^a-zA-Z0-9 /./'/"/,/@/+/-/_/(/)/[]/g, '');
}

export function parseRevertReason(revertOutput: string): string {
    if (!revertOutput || revertOutput.length < 138) {
        return '';
    }

    let reason = '';
    const trimmedOutput = revertOutput.substr(138);
    for (let i = 0; i < trimmedOutput.length; i += 2) {
        reason += String.fromCharCode(parseInt(trimmedOutput.substr(i, 2), 16));
    }
    return reason;
}

export function parsePanicReason(revertOutput: string): string {
    const trimmedOutput = revertOutput.slice(-2);
    let reason;

    switch (trimmedOutput) {
    case '01':
        reason = 'If you call assert with an argument that evaluates to false.';
        break;
    case '11':
        reason = 'If an arithmetic operation results in underflow or overflow outside of an unchecked { ... } block.';
        break;
    case '12':
        reason = 'If you divide or modulo by zero (e.g. 5 / 0 or 23 % 0).';
        break;
    case '21':
        reason = 'If you convert a value that is too big or negative into an enum type.';
        break;
    case '31':
        reason = 'If you call .pop() on an empty array.';
        break;
    case '32':
        reason = 'If you access an array, bytesN or an array slice at an out-of-bounds or negative index ' +
            '(i.e. x[i] where i >= x.length or i < 0).';
        break;
    case '41':
        reason = 'If you allocate too much memory or create an array that is too large.';
        break;
    case '51':
        reason = 'If you call a zero-initialized variable of internal function type.';
        break;
    default:
        reason = 'Default panic message';
    }
    return reason;
}

export function sortAbiFunctionsByName(fns: EvmABIEntry[]): EvmABIEntry[] {
    return fns.sort(
        (entryA, entryB) => {
            const upperA = entryA.name.toUpperCase();
            const upperB = entryB.name.toUpperCase();
            return (upperA < upperB) ? -1 : (upperA > upperB) ? 1 : 0;
        },
    );
}

/**
 * Determine whether the user's device is an Apple touch device
 *
 * @return {boolean}
 */
export function getClientIsApple() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}


/*
* Determines whether the amount is too large (more than six characters long) to be displayed in full on mobile devices
*
* @param {number} amount - the currency amount
* return {boolean} - true if the amount is too large to be displayed in full on mobile devices
* */
export function isAmountTooLarge(amount: number | string): boolean {
    const primaryAmountIsTooLarge =
        (typeof amount === 'number' && amount.toString().length > 6) ||
        (typeof amount === 'string' && amount.length > 6);

    return primaryAmountIsTooLarge;
}



/*
* Formats a token balance amount in a localized way, using 4 decimals,
* abbreviating if the amount is too large to be displayed in full on mobile devices only if tiny is true
*
* @param {number} amount - the currency amount
* @param {number} locale - user's locale code, e.g. 'en-US'. Generally gotten from the user store like useUserStore().locale
* @param {boolean} tiny - whether to abbreviate the value, e.g. 123456.78 => 123.46K. Ignored for values under 1000
* @param {string?} symbol - symbol for the currency to be used, e.g. 'TLOS'. If defined, the symbol will be displayed, e.g. 123.00 TLOS.
* return {string} - the formatted amount
* */
export function prettyPrintBalance(amount: number | string, locale: string, tiny: boolean, symbol = '') {
    return ['', ' ' + symbol].join(prettyPrintCurrency(+amount, 4, locale, tiny ? isAmountTooLarge(amount) : false));
}

/*
* Formats a fiat balance amount in a localized way, using 2 decimals,
* abbreviating if the amount is too large to be displayed in full on mobile devices only if tiny is true
*
* @param {number} amount - the currency amount
* @param {number} locale - user's locale code, e.g. 'en-US'. Generally gotten from the user store like useUserStore().locale
* @param {boolean} tiny - whether to abbreviate the value, e.g. 123456.78 => 123.46K. Ignored for values under 1000
* @param {string?} currency - code for the currency to be used, e.g. 'USD'. If defined, either the symbol or code (determined by the param displayCurrencyAsSymbol) will be displayed, e.g. $123.00 . Generally gotten from the user store like useUserStore().currency
* return {string} - the formatted amount
* */
export function prettyPrintFiatBalance(fiatAmount: number | string, locale: string, tiny: boolean, currency = 'USD') {
    return prettyPrintCurrency(+fiatAmount, 2, locale, tiny ? isAmountTooLarge(fiatAmount) : false, currency);
}

/**
 * Converts gas price, which is in its own unit, to TLOS
 *
 * @param {string} gasUsed - amount of gas used as string representation of a number/hex
 * @param {string} gasPrice - gas price in TLOS as string representation of a number/hex
 *
 * @return {string} gas in TLOS as a number string
 */
export function getGasInTlos(gasUsed: string, gasPrice: string) {
    return formatWei(
        BigNumber.from(gasPrice)
            .mul(gasUsed).toLocaleString(),
        WEI_PRECISION,
        5,
    );
}

/**
 * Takes an ethereum hash ('0x...') and returns a shortened version, like '0x0000...0000'
 * @param {string} hash - a string beginning with 0x and containing only 0-9, a-f, or A-F
 *
 * @return {string} shortened hash
 */
export function getShortenedHash(hash: string) {
    const textIsAddress = /^0x[0-9a-fA-F]+$/.test(hash);

    if (textIsAddress) {
        return hash.slice(0, 6) + '...' + hash.slice(-4);
    } else {
        throw new Error('Invalid hash ' + hash);
    }
}
