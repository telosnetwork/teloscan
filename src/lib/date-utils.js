/**
 * Formats a Unix timestamp (in milliseconds) as a string in the format YYYY-MM-DD HH:MM:SS
 *
 * @param {number} unixTimestampMs
 * @returns {string} - formatted timestamp
 */
export function formatTimestamp(unixTimestampMs) {
    const date = new Date(unixTimestampMs);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
