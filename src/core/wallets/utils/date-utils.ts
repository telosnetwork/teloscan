/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/**
 * Useful date-related constants
 */
export const HOUR_SECONDS = 60 * 60;
export const DAY_SECONDS = 24 * HOUR_SECONDS;


/**
 * Returns true if the given epochMs is less than the given number of minutes ago
 * @param epochMs seconds since epoch representing the date to check
 * @param minutes number of minutes to check against
 * @returns {boolean} true if the given epochMs is less than the given number of minutes ago
 */
export function dateIsWithinXMinutes(epochMs: number, minutes: number) {
    if (epochMs <= 0) {
        throw new Error('epochMs must be greater than 0');
    }

    if (epochMs % 1 !== 0) {
        throw new Error('epochMs must be an integer');
    }

    // make a date object which represents the time X minutes ago
    const xMinsAgo = new Date();
    xMinsAgo.setMinutes(xMinsAgo.getMinutes() - minutes);

    // return true if the date is within the defined timeframe
    return new Date(epochMs) > xMinsAgo;
}


/**
 * Translates a number of seconds to a natural language time period using the given translation function.
 *
 * @param {number|null} seconds number of seconds since epoch representing the date to check
 * @param {function} $t translation function. Should accept a string (just the keyname without a path) and return a translated string
 * @returns {string} plain english time period
 */
export function formatUnstakePeriod(seconds: number|null, $t: (key:string) => string) {
    if (seconds === null) {
        return '--';
    }

    let quantity;
    let unit;

    if (seconds < HOUR_SECONDS) {
        quantity = seconds / 60;
        unit = $t('minutes');
    } else if (seconds < DAY_SECONDS) {
        quantity = seconds / HOUR_SECONDS;
        unit = $t('hours');
    } else {
        quantity = seconds / DAY_SECONDS;
        unit = $t('days');
    }

    if (!Number.isInteger(quantity)) {
        quantity = quantity.toFixed(1);
    }

    return `${quantity} ${unit}`;
}

