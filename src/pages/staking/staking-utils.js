const DAY_SECONDS = 86400;
const HOUR_SECONDS = 3600;

/**
 * Translates a number of seconds to a plain-english string, eg. 90 => "1.5 minutes"
 *
 * @param {number|null} seconds
 * @returns {string} plain english time period
 */
export function formatUnstakePeriod(seconds) {
    if (seconds === null)
        return '--';

    let quantity;
    let unit;

    if (seconds < HOUR_SECONDS) {
        quantity = seconds / 60;
        unit = 'minutes';
    } else if (seconds < DAY_SECONDS) {
        quantity = seconds / HOUR_SECONDS;
        unit = 'hours';
    } else {
        quantity = seconds / DAY_SECONDS;
        unit = 'days';
    }

    if (!Number.isInteger(quantity))
        quantity = quantity.toFixed(1);

    return `${quantity} ${unit}`;
}

export async function fetchStlosApy($telosApi) {
    try{
        return (await $telosApi.get('apy/evm')).data;
    }catch(e) {
        console.error(e);
    }
}
