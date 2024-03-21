import { DAY_SECONDS, HOUR_SECONDS } from 'src/antelope/wallets/utils/date-utils';

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
