import { DAY_SECONDS, HOUR_SECONDS } from 'src/core/wallets/utils/date-utils';

/**
 * Translates a number of seconds to a natural language time period using the given translation function.
 *
 * @param {number} seconds number of seconds since epoch representing the date to check
 * @param {function} $t translation function. Should accept a string (just the keyname without a path) and return a translated string
 * @returns {string} plain language time period
 */
export function formatTimePeriod(seconds: number, $t: (key: string) => string) {
    let quantity: number;
    let unit: string;

    if (seconds < 60) {
        quantity = Math.round(seconds);
        unit = quantity === 1 ? $t('antelope.words.second') : $t('antelope.words.seconds');
    } else if (seconds < HOUR_SECONDS) {
        quantity = Math.round(seconds / 60);
        unit = quantity === 1 ? $t('antelope.words.minute') : $t('antelope.words.minutes');
    } else if (seconds < DAY_SECONDS) {
        quantity = Math.round(seconds / HOUR_SECONDS);
        unit = quantity === 1 ? $t('antelope.words.hour') : $t('antelope.words.hours');
    } else {
        quantity = Math.round(seconds / DAY_SECONDS);
        unit = quantity === 1 ? $t('antelope.words.day') : $t('antelope.words.days');
    }

    return `${quantity} ${unit}`;
}

/**
 * Formats a Unix timestamp (in milliseconds) as a string in the format YYYY-MM-DD HH:MM:SS
 *
 * @param {number} unixTimestampMs
 * @returns {string} - formatted timestamp
 */
export function formatTimestamp(unixTimestampMs: number) {
    const date = new Date(unixTimestampMs);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

