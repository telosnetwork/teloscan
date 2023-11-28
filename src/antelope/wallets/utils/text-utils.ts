/* eslint-disable max-len */

/**
 * Given some text, ellipsizes the text if it exceeds a specific length
 *
 * @param text
 * @param maxLength
 * @returns {string}
 */
export function truncateText(text: string, maxLength = 10): string {
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength)}...`;
}

/**
 * Given an address, returns a shortened version like `0x0000...0000`
 *
 * @param address
 * @param maxLength
 * @returns {string}
 */
export function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Given a name and an id, returns the name without the ID. Generally in the UI, NFT name and ID are displayed next to each other;
 * this function prevents the ID from duplicated
 * @param name
 * @param id
 * @returns {string}
 * @example
 * getShapedNftName('SomeNft #1234', '1234') // 'SomeNft'
 */
export function getShapedNftName(name: string, id: string): string {
    let shapedName = name;
    if (name.includes(id)) {
        shapedName = name.replace(id, '');

        if (shapedName[shapedName.length - 1] === '#') {
            shapedName = shapedName.slice(0, -1);
        }
    }
    return shapedName.trim();
}
