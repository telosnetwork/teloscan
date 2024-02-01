/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { formatUnits } from '@ethersproject/units';
import Decimal from 'decimal.js';
import { WEI_PRECISION } from 'src/antelope/wallets/utils';

/**
 * Given a number or string, returns a string representation of the number with up to 18 decimal places
 * @param value - number or string to convert to string
 * @returns {string} string representation of the number
 */

export function toStringNumber(value: number | string): string {
    if (typeof value === 'string') {
        return value;
    } if (typeof value === 'number') {
        const num = new Decimal(value);
        return num.toFixed(WEI_PRECISION);
    }
    throw new Error(`Invalid value type: ${typeof value}`);
}

/**
 * Given a locale string, returns the character used to separate integer and decimal portions of a number,
 * e.g "." as in 123.456
 * @param locale - standard locale code, such as "en-US"
 * @returns {string} decimal separator character
 */
export function getDecimalSeparatorForLocale(locale: string) {
    const numberWithDecimalSeparator = 1.1;
    const formattedNumber = new Intl.NumberFormat(locale).format(numberWithDecimalSeparator);
    return formattedNumber.charAt(1); // Get the character between "1" and "1"
}

/**
 * Given a locale string, returns the character used to separate groups of numbers in a large number,
 * e.g "," as in 123,456,789.00
 *
 * @param { string } locale - standard locale code, such as "en-US"
 *
 * @returns {string} large number separator character
 */
export function getLargeNumberSeparatorForLocale(locale: string) {
    const largeNumber = 1000000;
    const formattedNumber = new Intl.NumberFormat(locale).format(largeNumber);

    const nonDigitCharacters = formattedNumber.match(/\D+/g);

    if (!nonDigitCharacters || nonDigitCharacters.length === 0) {
        return '';
    }

    return nonDigitCharacters[0];
}

/**
 * Given a localized number string, returns a BigNumber
 *
 * @param {string} formatted - localized number string, e.g. "123,456.78"
 * @param {number} decimals - number of decimals the number has, e.g. 2 for 123,456.78
 * @param {string} locale - standard locale code, such as "en-US"
 *
 * @returns {BigNumber} BigNumber representation of the number
 */
export function getBigNumberFromLocalizedNumberString(formatted: string, decimals: number, locale: string): BigNumber {
    const decimalSeparator = getDecimalSeparatorForLocale(locale);
    const largeNumberSeparator = getLargeNumberSeparatorForLocale(locale);
    const notIntegerOrSeparatorRegex = new RegExp(`[^0-9${decimalSeparator}${largeNumberSeparator}]`, 'g');

    if (formatted.match(notIntegerOrSeparatorRegex)) {
        throw new Error('Invalid number format');
    }

    // if decimals is not a positive integer, throw an error
    if (decimals % 1 !== 0 || decimals < 0) {
        throw new Error('Invalid decimals value');
    }

    // strip any character which is not an integer or decimal separator
    const notIntegerOrDecimalSeparatorRegex = new RegExp(`[^0-9${decimalSeparator}]`, 'g');
    let unformatted = formatted.replace(notIntegerOrDecimalSeparatorRegex, '');

    // if the decimal separator is anything but a dot, replace it with a dot to allow conversion to number
    if (decimalSeparator !== '.') {
        unformatted = unformatted.replace(/[^0-9.]/g, '.');
    }

    return parseUnits(unformatted, decimals);
}

/*
* Formats a currency amount in a localized way
*
* @param {number|BigNumber} amount - the currency amount
* @param {number} precision - the number of decimals that should be displayed. Ignored if abbreviate is true and the value is over 1000
* @param {string} locale - user's locale code, e.g. 'en-US'. Generally gotten from the user store like useUserStore().locale
* @param {boolean} abbreviate - whether to abbreviate the value, e.g. 123456.78 => 123.46K. Ignored for values under 1000
* @param {string?} currency - code for the currency to be used, e.g. 'USD'. If defined, either the symbol or code (determined by the param displayCurrencyAsSymbol) will be displayed, e.g. $123.00 . Generally gotten from the user store like useUserStore().currency
* @param {boolean?} displayCurrencyAsCode - if currency is defined, controls whether the currency is display as a symbol or code, e.g. $100 or USD 100. Only valid for fiat currencies.
* @param {number?} tokenDecimals - required if amount is BigNumber. The number of decimals a token has, e.g. 18 for TLOS. This option is not used for non-BigNumber amounts
* @param {boolean?} trimZeroes - trim trailing zeroes for decimal values, e.g. '123.000' => '123', '123.45600' => '123.456'. Overrides 'precision' when there are trailing zeroes
* */
export function prettyPrintCurrency(
    amount: number | BigNumber,
    precision: number,
    locale: string,
    // eslint-disable-next-line default-param-last
    abbreviate = false,
    currency?: string,
    displayCurrencyAsCode?: boolean,
    tokenDecimals?: number,
    trimZeroes?: boolean,
): string {
    if (precision % 1 !== 0 || precision < 0) {
        throw new Error('Precision must be a positive integer or zero');
    }

    if (typeof tokenDecimals === 'number' && (tokenDecimals % 1 !== 0 || tokenDecimals < 0)) {
        throw new Error('Token decimals must be a positive integer or zero');
    }

    // require token decimals if type is BigNumber
    if (typeof amount !== 'number' && typeof tokenDecimals !== 'number') {
        throw new Error('Token decimals is required for BigNumber amounts');
    }

    const decimalSeparator = getDecimalSeparatorForLocale(locale);
    const trailingZeroesRegex = new RegExp(`\\${decimalSeparator}?0+(\\D|$)`, 'g');

    const decimalOptions : Record<string, number | undefined> = {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision,
        minimumIntegerDigits: undefined,
        maximumIntegerDigits: undefined,
    };

    const currencyOptions : Record<string, string | boolean | undefined> = {
        style: currency ? 'currency' : undefined,
        currencyDisplay: currency ? (displayCurrencyAsCode ? 'code' : 'symbol') : undefined,
        currency,
    };

    if (typeof amount === 'number') {
        if (amount < 1 && amount > 0) {
            decimalOptions.maximumIntegerDigits = 1;
            decimalOptions.minimumIntegerDigits = 1;
        } else if (abbreviate) {
            const forceFractionDisplay = amount < 1000 && amount > -1000;

            decimalOptions.maximumFractionDigits = forceFractionDisplay ? precision : 2;
            decimalOptions.minimumFractionDigits = forceFractionDisplay ? precision : 2;
            decimalOptions.maximumIntegerDigits = 3;
        }

        let finalFormattedValue = Intl.NumberFormat(
            locale,
            {
                notation: abbreviate ? 'compact' : undefined,
                ...currencyOptions,
                ...decimalOptions,
            },
        ).format(amount);

        if ((trimZeroes || precision === 0) && finalFormattedValue.indexOf(decimalSeparator) > -1) {
            finalFormattedValue = finalFormattedValue.replace(trailingZeroesRegex, '');
        }

        return finalFormattedValue;
    }
    if (amount.lt(1) && amount.gt(0)) {
        decimalOptions.maximumIntegerDigits = 1;
        decimalOptions.minimumIntegerDigits = 1;
    } else if (abbreviate) {
        const forceFractionDisplay = amount.lt(1000) && amount.gt(-1000);

        decimalOptions.maximumFractionDigits = forceFractionDisplay ? precision : 2;
        decimalOptions.minimumFractionDigits = forceFractionDisplay ? precision : 2;
        decimalOptions.maximumIntegerDigits = 3;
    }

    // Intl format method only takes number / bigint, and a BigNumber value cannot have a fractional amount,
    // and also decimals may be more places than maximum JS precision.
    // As such, decimals must be handled specially for BigNumber amounts.

    const amountAsString = formatUnits(amount, tokenDecimals); // amount string, like "1.0"

    const [integerString, decimalString] = amountAsString.split('.');

    const formattedInteger = Intl.NumberFormat(
        locale,
        { notation: abbreviate ? 'compact' : undefined },
    ).format(BigInt(integerString));

    const formattedDecimal = decimalString.slice(0, precision || 1).padEnd(precision, '0');

    let finalFormattedValue;

    if (abbreviate) {
        finalFormattedValue = formattedInteger; // drop decimals for abbreviated amounts
    } else {
        finalFormattedValue = `${formattedInteger}${decimalSeparator}${formattedDecimal}`;
    }

    if ((trimZeroes || precision === 0) && finalFormattedValue.indexOf(decimalSeparator) > -1) {
        finalFormattedValue = finalFormattedValue.replace(trailingZeroesRegex, '');
    }

    if (precision === 2 && tokenDecimals === 2 && currency) {
    // value is a fiat currency with 2 decimals, so add the currency symbol
        if (displayCurrencyAsCode) {
            finalFormattedValue = `${finalFormattedValue}\u00A0${currency}`;
        } else {
            const symbol = getCurrencySymbol(locale, currency);
            finalFormattedValue = `${symbol}${finalFormattedValue}`;
        }
    } else if (currency) {
        finalFormattedValue += ` ${currency}`;
    }

    return finalFormattedValue;
}

/**
 * Converts a currency amount from one token to another
 *
 * @param {BigNumber} tokenOneAmount - the amount of token one
 * @param {number} tokenOneDecimals - the number of decimals token one has
 * @param {number} tokenTwoDecimals - the number of decimals token two has
 * @param {string|number} conversionFactor - the conversion rate from token one to token two
 *
 * @returns {BigNumber} the amount of token two equivalent to the amount of token one
 */
export function convertCurrency(tokenOneAmount: BigNumber, tokenOneDecimals: number, tokenTwoDecimals: number, conversionFactor: string | number): BigNumber {
    const conversionRate = toStringNumber(conversionFactor);
    const leadingZeroesRegex = /^0+/g;
    const trailingZeroesRegex = /0+$/g;
    const floatRegex = /^\d+(\.\d+)?$/g;

    if (!Number.isInteger(tokenOneDecimals) || tokenOneDecimals <= 0) {
        throw new Error('Token one decimals must be a positive integer or zero');
    }

    if (!Number.isInteger(tokenTwoDecimals) || tokenTwoDecimals <= 0) {
        throw new Error('Token two decimals must be a positive integer or zero');
    }

    if (!floatRegex.test(conversionRate) || Number(conversionRate) <= 0) {
        throw new Error('Conversion rate must be a positive floating point number or integer');
    }

    if (tokenOneAmount.lt(0)) {
        throw new Error('Token one amount must be positive');
    }

    const tenBn = BigNumber.from(10);

    // represents the maximum significant figures of conversion calculations
    const precisionCutoffBn = BigNumber.from(256);

    const [rawConversionRateIntegers, rawConversionRateDecimals = ''] = conversionRate.split('.');
    const conversionRateIntegers = rawConversionRateIntegers.replace(leadingZeroesRegex, '');
    const conversionRateDecimals = rawConversionRateDecimals.replace(trailingZeroesRegex, '');

    const numberOfConversionRateDecimals = conversionRateDecimals.length;

    const conversionRateScalingFactor = BigNumber.from(numberOfConversionRateDecimals).add(precisionCutoffBn);
    const conversionRateAsIntegerString = conversionRateIntegers.concat((conversionRateDecimals ?? ''));

    const conversionRateBn = BigNumber.from(conversionRateAsIntegerString);
    const scaledConversionRate = conversionRateBn.mul(tenBn.pow(conversionRateScalingFactor));

    // normalize amount to 256 precision
    const normalizedAmount = tokenOneAmount.mul(tenBn.pow((precisionCutoffBn.sub(tokenOneDecimals))));

    // multiply amount by conversion rate integer
    const normalizedScaledAmountTwo = normalizedAmount.mul(scaledConversionRate);

    // denormalize from 256 precision to tokenTwoDecimals
    const denormalizedScaledAmountTwo = normalizedScaledAmountTwo.div(tenBn.pow((precisionCutoffBn.sub(tokenTwoDecimals))));

    // remove conversion rate scaling
    return denormalizedScaledAmountTwo.div(tenBn.pow(conversionRateScalingFactor.add(numberOfConversionRateDecimals)));
}

/**
 * Inverts a floating point number, useful for taking a conversion rate from token A to token B and getting the
 * conversion rate from token B to token A
 *
 * @param {number|string} float - the floating point number to invert
 *
 * @returns {string} the inverted floating point number rounded to 18 decimal places
 */
export function getFloatReciprocal(float: number | string) {
    const floatRegex = /^\d+(\.\d+)?$/g;
    const trailingZeroesRegex = /0+$/g;
    const trailingDotRegex = /\.$/g;

    if (!floatRegex.test(float.toString())) {
        throw new Error('Conversion rate must be a positive floating point number or integer');
    }

    if (parseFloat(float.toString()) === 0) {
        throw new Error('Error inverting: cannot divide by zero');
    }

    return new Decimal(1)
        .dividedBy(float)
        .toFixed(WEI_PRECISION)
        .replace(trailingZeroesRegex, '')
        .replace(trailingDotRegex, '');
}

/**
 * Given a locale and currency code, returns the symbol for the currency, e.g. '$' for USD
 * @param {string} locale - locale code, e.g. 'en-US'
 * @param {string} currencyCode - standard currency code, e.g. 'USD'
 */
export function getCurrencySymbol(locale: string, currencyCode: string) {
    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'symbol',
    });

    const parts = formatter.formatToParts(123);

    let symbol;

    for (let i = 0; i < parts.length; i++) {
        if (parts[i].type === 'currency') {
            symbol = parts[i].value;
            break;
        }
    }

    return symbol;
}

/**
 * Launches a prompt in MetaMask to add a given token as a tracked token, allowing the user to view their balance of
 * that token at a glance from MetaMask
 *
 * @param {string}    address - the address of the token contract
 * @param {string}    symbol - the token's ticker symbol, e.g. 'STLOS'
 * @param {string}    image - permalink url of the token's icon
 * @param {string}    type - Ethereum standard of the token; default is 'ERC20'
 * @param {number}    decimals - the number of decimals constituting the token's precision, default is 18
 *
 * @returns {Promise<void>}
 */
export async function promptAddToMetamask(
    address: string,
    symbol: string,
    image: string,
    type: string,
    decimals: number,
): Promise<void> {
    if (typeof window !== 'undefined' && !window.ethereum) {
        return Promise.reject();
    }

    type MetamaskEthereum = {
        request: (args: { method: string, params: Record<string, unknown> }) => Promise<void>
    };

    const ethereum = (typeof window !== 'undefined' ? window.ethereum : {}) as unknown as MetamaskEthereum;

    return ethereum.request({
        method: 'wallet_watchAsset',
        params: {
            type,
            options: {
                address,
                symbol,
                decimals,
                image,
            },
        },
    });
}
