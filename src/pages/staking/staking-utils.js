import stlosLogo from 'assets/stlos-logo.png';
import { WEI_PRECISION } from 'src/lib/utils';

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

export async function promptAddToMetamask() {
    return window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
            type: 'ERC20',
            options: {
                address: process.env.STAKED_TLOS_CONTRACT_ADDRESS,
                symbol: 'STLOS',
                decimals: WEI_PRECISION,
                image: stlosLogo, // eztodo this is broken, results in a string 'img/stlos-logo.png'
            },
        },
    }).catch(({ message }) => {
        console.error(message);
    });
}
