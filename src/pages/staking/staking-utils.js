import Big from 'big.js';
import { ethers } from 'ethers';

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

export async function fetchStlosApy($api, tvl) {
    if (tvl.eq('0')) {
        return '0';
    }

    const rexPoolResponse = await $api.getTableRows({
        code: 'eosio',
        scope: 'eosio',
        table: 'rexpool',
        limit: '1',
    });

    if (!rexPoolResponse || !rexPoolResponse.rows.length) {
        console.error('Failed to fetch rexpool');
        return;
    }

    const distConfigResponse = await $api.getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'config',
        limit: '1',
    });

    if (!distConfigResponse || !distConfigResponse.rows.length) {
        console.error('Failed to fetch exrsrv.tf config');
        return;
    }

    const payoutsResponse = await $api.getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'payouts',
        limit: '100',
    });

    if (!payoutsResponse || !payoutsResponse.rows.length) {
        console.error('Failed to fetch exrsrv.tf payouts');
        return;
    }

    const rexStats = rexPoolResponse.rows[0];
    const distConfig = distConfigResponse.rows[0];
    const payoutRow = payoutsResponse.rows.find((row) => row.to === 'eosio.rex');

    const annualPayout = new Big(payoutRow.amount).times(new Big(60 * 60 * 24 * 365).div(payoutRow.interval));
    const fixedRatio = new Big(distConfig.ratio).div(100);
    const rexTotal = new Big(rexStats.total_lendable.split(' ')[0]);
    const stlosTotal = new Big(ethers.utils.formatEther(tvl));

    const balanceRatio = rexTotal.eq(0) ? -1 : stlosTotal.times(fixedRatio).div(rexTotal);

    if (balanceRatio.eq(0)) {
        return '0';
    }

    const rexPayout = annualPayout.div(balanceRatio.plus(1));
    const stlosPayout = annualPayout.minus(rexPayout);

    const apy = stlosPayout.div(stlosTotal).times(100).toFixed(2);
    console.log(`Rex APY: ${rexPayout.div(rexTotal).times(100).toFixed(2)}%`);
    console.log(`sTLOS APY: ${apy}%`);

    return apy;
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
                image: `${window.location.origin}/stlos-logo.png`,
            },
        },
    }).catch(({ message }) => {
        console.error(message);
    });
}
