const DAY_SECONDS = 86400;
const HOUR_SECONDS = 3600;

export function formatUnstakePeriod(seconds) {
    if (seconds === null)
        return '--';

    if (seconds < HOUR_SECONDS) {
        return `${seconds / 60} minutes`;
    } else if (seconds < DAY_SECONDS) {
        return `${seconds / HOUR_SECONDS} hours`;
    } else {
        return `${seconds / DAY_SECONDS} days`;
    }
}
