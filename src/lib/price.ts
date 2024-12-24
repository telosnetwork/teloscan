import axios, { AxiosInstance } from 'axios';
import {
    MarketSourceInfo,
    NativeCurrencyAddress,
    PriceChartData,
    PriceHistory,
    PriceStats,
    TokenMarketData,
    TokenPrice,
} from 'src/core/types';
import EVMChainSettings from 'src/core/chains/EVMChainSettings';
import { dateIsWithinXMinutes } from 'src/core/stores/utils/date-utils';

interface CachedPrice {
    lastFetchTime: number | null,
    lastPrice: number | null,
}

const priceCache: { [tokenId: string]: CachedPrice } = {};

export const getCoingeckoUsdPrice = async (
    tokenId: string,
): Promise<number> => {
    const now = Date.now();

    if (priceCache[tokenId] &&
        priceCache[tokenId].lastFetchTime &&
        now - (priceCache[tokenId].lastFetchTime as number) < 60 * 1000 &&
        priceCache[tokenId].lastPrice !== null
    ) {
        // If less than a minute has passed since the last fetch, return the cached price.
        console.debug(`Returning cached price for ${tokenId}: ${priceCache[tokenId].lastPrice}`);
        return priceCache[tokenId].lastPrice as number;
    }

    try {
        const stats: PriceStats = await axios.get(
            getCoingeckoExchangeStatsUrl(tokenId),
        );

        if (stats && stats.status === 200) {
            const price = stats.data[tokenId].usd;
            priceCache[tokenId] = { lastFetchTime: now, lastPrice: price };
            return price;
        } else {
            console.error(`Error: received status code ${stats.status} from Coingecko.`);
            return 0;
        }
    } catch (error) {
        console.error('Error: fetching from Coingecko failed.', error);
        return 0;
    }
};

// fetch the fiat price for a token as a number
export async function getFiatPriceFromIndexer(
    tokenSymbol: string,
    tokenAddress: string,
    fiatCode: string,
    indexerAxios: AxiosInstance,
    chain_settings: EVMChainSettings,
): Promise<number> {
    const price = await getTokenPriceDataFromIndexer(tokenSymbol, tokenAddress, fiatCode, indexerAxios, chain_settings);

    if (price) {
        return +price.str;
    }

    return 0;
}

// fetch the price data for a particular token from the indexer
export async function getTokenPriceDataFromIndexer(
    tokenSymbol: string,
    tokenAddress: string,
    fiatCode: string,
    indexerAxios: AxiosInstance,
    chain_settings: EVMChainSettings,
): Promise<TokenPrice | null> {
    const wrappedSystemAddress = chain_settings.getWrappedSystemToken().address;
    const actualTokenAddress = tokenAddress === NativeCurrencyAddress ? wrappedSystemAddress : tokenAddress;
    const response = (await indexerAxios.get(`/v1/tokens/marketdata?tokens=${tokenSymbol}&vs=${fiatCode}`)).data as { results: MarketSourceInfo [] };

    const tokenMarketDataSource = response.results.find(
        tokenData => (tokenData.address ?? '').toLowerCase() === actualTokenAddress.toLowerCase(),
    );

    if (!tokenMarketDataSource?.updated || !tokenMarketDataSource.price) {
        return null;
    }

    const lastPriceUpdated = (new Date(+tokenMarketDataSource.updated)).getTime();

    // only use indexer data if it is no more than 10 minutes old
    if (dateIsWithinXMinutes(lastPriceUpdated, 10)) {

        const marketData = new TokenMarketData(tokenMarketDataSource);
        return new TokenPrice(marketData);
    }
    // if indexer data is stale, return no data
    return null;
}

export const getCoingeckoPriceChartData = async (
    tokenId: string,
): Promise<PriceChartData> => {
    const exchangeStatsUrl = getCoingeckoExchangeStatsUrl(tokenId);
    const priceHistoryUrl = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=USD&days=1&interval=hourly`;

    const [priceStats, priceHistory]: [PriceStats, PriceHistory] =
    await Promise.all([
        axios.get(exchangeStatsUrl),
        axios.get(priceHistoryUrl),
    ]);

    return {
        lastUpdated: priceStats.data[tokenId].last_updated_at,
        tokenPrice: priceStats.data[tokenId].usd,
        dayChange: priceStats.data[tokenId].usd_24h_change,
        dayVolume: priceStats.data[tokenId].usd_24h_vol,
        marketCap: priceStats.data[tokenId].usd_market_cap,
        prices: priceHistory.data.prices,
    };
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getEmptyPriceChartData = async (): Promise<PriceChartData> => ({
    lastUpdated: 0,
    tokenPrice: 0,
    dayChange: 0,
    dayVolume: 0,
    marketCap: 0,
    prices: [],
});

const getCoingeckoExchangeStatsUrl = (tokenId: string): string => `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=USD&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
