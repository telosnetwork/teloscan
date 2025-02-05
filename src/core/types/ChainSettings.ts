/* eslint-disable no-unused-vars */
import { RpcEndpoint } from 'universal-authenticator-library';
import { BrandingType, PriceChartData, TokenClass } from 'src/core/types';

export interface ChainSettings {
    init(): Promise<void>;
    isNative(): boolean;
    isTestnet(): boolean;
    getNetwork(): string;
    getSystemToken(): TokenClass;
    getTokenList(): Promise<TokenClass[]>;
    getDisplay(): string;
    getBranding(): BrandingType;
    getSmallLogoPath(): string;
    getLargeLogoPath(): string;
    getChainId(): string;
    getHyperionEndpoint(): string;
    getRPCEndpoint(): RpcEndpoint;
    getApiEndpoint(): string;
    getPriceData(): Promise<PriceChartData>;
    getUsdPrice(): Promise<number>;
    getSystemTokens(): TokenClass[];
    getApy(): Promise<string>;
}
