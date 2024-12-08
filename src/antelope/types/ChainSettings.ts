/* eslint-disable no-unused-vars */
import { RpcEndpoint } from 'universal-authenticator-library';
import { IndexerTransactionsFilter, NFTClass, PriceChartData, TokenClass } from 'src/antelope/types';

export interface ChainSettings {
    init(): Promise<void>;
    isNative(): boolean;
    isTestnet(): boolean;
    getNetwork(): string;
    getSystemToken(): TokenClass;
    getTokenList(): Promise<TokenClass[]>;
    getDisplay(): string;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getHyperionEndpoint(): string;
    getRPCEndpoint(): RpcEndpoint;
    getApiEndpoint(): string;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
    getSystemTokens(): TokenClass[];
    getNFTsInventory(address: string, filter: IndexerTransactionsFilter): Promise<NFTClass[]>;
    getNFTsCollection(contract: string, filter: IndexerTransactionsFilter): Promise<NFTClass[]>;
    trackAnalyticsEvent(params: Record<string, unknown>): void;
    getApy(): Promise<string>;
}
