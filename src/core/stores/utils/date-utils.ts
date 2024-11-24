import { fromUnixTime, format } from 'date-fns';

/**
 * Useful date-related constants
 */
export const MINUTE_SECONDS = 60;
export const HOUR_SECONDS   = 60  * MINUTE_SECONDS;
export const DAY_SECONDS    = 24  * HOUR_SECONDS;
export const WEEK_SECONDS   = 7   * DAY_SECONDS;
export const MONTH_SECONDS  = 30  * DAY_SECONDS;
export const YEAR_SECONDS   = 365 * DAY_SECONDS;

export const DEFAULT_DATE_FORMAT = 'MMM d, yyyy hh:mm:ss a';

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
export function prettyTimePeriod(seconds: number|null, $t: (key: string) => string, units = '', round = false) {
    if (seconds === null) {
        return '--';
    }

    let quantity;
    let unit;

    if (seconds < HOUR_SECONDS || units === 'minutes') {
        quantity = seconds / MINUTE_SECONDS;
        unit = $t('minutes');
    } else if (seconds < DAY_SECONDS || units === 'hours') {
        quantity = seconds / HOUR_SECONDS;
        unit = $t('hours');
    } else if (seconds < WEEK_SECONDS || units === 'days') {
        quantity = seconds / DAY_SECONDS;
        unit = $t('days');
    } else if (seconds < MONTH_SECONDS || units === 'weeks') {
        quantity = seconds / WEEK_SECONDS;
        unit = $t('weeks');
    } else if (seconds < YEAR_SECONDS || units === 'months') {
        quantity = seconds / MONTH_SECONDS;
        unit = $t('months');
    } else {
        quantity = seconds / YEAR_SECONDS;
        unit = $t('years');
    }

    const fractionDigits = round ? 0 : 1;

    const formatter = new Intl.NumberFormat(navigator.language, { maximumFractionDigits: fractionDigits });
    const formattedQuantity = formatter.format(quantity);

    return `${formattedQuantity} ${unit}`;
}

/**
 *  Given a Date object, return the pretty-printed timezone offset, e.g. "+05:00"
 *
 * @param {Date} date
 * @return {string}
 */
export function getFormattedUtcOffset(date: Date): string {
    const pad = (value: number) => value < 10 ? '0' + value : value;
    const sign = (date.getTimezoneOffset() > 0) ? '-' : '+';
    const offset = Math.abs(date.getTimezoneOffset());
    const hours = pad(Math.floor(offset / 60));
    const minutes = pad(offset % 60);
    return sign + hours + ':' + minutes;
}

/**
 * Given a unix timestamp, returns string with the date in a given format showing UTC offset optionally.
 * @param epoch seconds since epoch
 * @param timeFormat a string containing the format of the date to be returned (based on date-fns format)
 * @param showUtc whether to show the UTC offset
 * @returns {string} the formatted date
 */
export function getFormattedDate(epoch: number, timeFormat = DEFAULT_DATE_FORMAT, showUtc = false): string {
    const offset = getFormattedUtcOffset(new Date(epoch));
    const utc = showUtc ? ` (UTC ${offset})` : '';
    return `${format(fromUnixTime(epoch), timeFormat)}${utc}`;
}
