import { indexerApi } from 'src/boot/telosApi';
import { BalanceQueryResponse, BalanceResult } from 'src/types/BalanceResult';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';

export interface SystemBalance {
    balance: string;
    fiatValue: number;
    tokenQty: string;
}

export async function getSystemBalance(address: string, fiatPrice: string): Promise<SystemBalance | null> {
    try {
        const response: BalanceQueryResponse = await indexerApi.get(
            `/account/${address}/balances?includeAbi=true`,
        );
        //TODO restore original api query when contract param query is fixed
        const systemTokenResult = response.data.results.find((r : BalanceResult) => r.contract === '___NATIVE_CURRENCY___') as BalanceResult;

        const balance = systemTokenResult ? systemTokenResult.balance : '0';
        const tokenQty = formatWei(balance, WEI_PRECISION, 4);
        const fiatValue = parseFloat(tokenQty) * parseFloat(fiatPrice);

        const result: SystemBalance = {
            balance,
            fiatValue,
            tokenQty,
        };
        return result;

    } catch (e) {
        console.error('Could not get balance: ', e);
    }
    return null;
}

