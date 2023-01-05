import { WEI_PRECISION } from 'src/lib/utils';

/**
 * Launches a prompt in MetaMask to add a given token as a tracked token, allowing the user to view their balance of
 * that token at a glance from MetaMask
 *
 * @param {object}    $q - a quasar instance, given from within a component at this.$q
 * @param {string}    address - the address of the token contract
 * @param {string}    symbol - the token's ticker symbol, e.g. 'STLOS'
 * @param {string}    image - permalink url of the token's icon
 * @param {string}    type - Ethereum standard of the token; default is 'ERC20'
 * @param {number}    decimals - the number of decimals constituting the token's precision, default is 18
 *
 * @returns {Promise<boolean>} - true iff the user granted the request to track sTLOS
 */
export async function promptAddToMetamask(
    $q,
    address,
    symbol,
    image,
    type = 'ERC20',
    decimals = WEI_PRECISION,
) {
    return window.ethereum.request({
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
    }).catch(({ message }) => {
        console.error(message);
        $q.notify({
            message: `Failed to add ${symbol} to MetaMask: ${message}`,
            color: 'negative',
        });
    });
}
