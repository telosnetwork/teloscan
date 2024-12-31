import EVMChainSettings from 'src/core/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { FooterLinksConfig, HeaderIndicators, HeaderMenuConfig, NativeCurrencyAddress, NetworkConfig, PriceChartData, SocialLink, Themes, addressString } from 'src/core/types';
import { TokenClass, TokenSourceInfo } from 'src/core/types';
import { useUserStore } from 'src/core';
import { getFiatPriceFromIndexer, getCoingeckoPriceChartData, getCoingeckoUsdPrice } from 'src/lib/price';

declare const fathom: { trackEvent: (eventName: string) => void };

// specific for Telos
import { TelosEvmApi } from '@telosnetwork/telosevm-js';

const config: NetworkConfig =
{
    'network': 'telos-evm-testnet',
    'display': 'Telos EVM (Testnet)',
    'title': 'TelosEVM Testnet Explorer',
    'branding': {
        'text': 'Teloscan',
        'icon': '/branding/telos-scan.png',
    },
    'chainId': '41',
    'isTestnet': true,
    'logos': {
        'large': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
        'small': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
    },
    'systemTokens': [
        {
            'name': 'Telos',
            'symbol': 'TLOS',
            'network': 'telos-evm-testnet',
            'decimals': 18,
            'address': NativeCurrencyAddress,
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
            'isNative': false,
            'isSystem': true,
        },
        {
            'name': 'Staked Telos',
            'symbol': 'STLOS',
            'network': 'telos-evm-testnet',
            'decimals': 18,
            'address': '0xa9991E4daA44922D00a78B6D986cDf628d46C4DD',
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/stlos.png',
            'isNative': false,
            'isSystem': false,
        },
        {
            'name': 'Wrapped Telos',
            'symbol': 'WTLOS',
            'network': 'telos-evm-testnet',
            'decimals': 18,
            'address': '0xaE85Bf723A9e74d6c663dd226996AC1b8d075AA9',
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/wtlos.png',
            'isNative': false,
            'isSystem': false,
        },
    ],
    'escrowContractAddress': '0x7E9cF9fBc881652B05BB8F26298fFAB538163b6f',
    'apiEndpoints': {
        'rpc': {
            'protocol': 'https',
            'host': 'rpc.testnet.telos.net',
            'port': 443,
            'path': '/evm',
        },
        'api': 'https://api-dev.telos.net/v1',
        'hyperion': 'https://rpc.testnet.telos.net',
        'explorer': 'https://testnet.teloscan.io',
        'ecosystem': 'https://www.telos.net/ecosystem',
        'bridge': 'https://telos-bridge-testnet.netlify.app/bridge',
        'indexer': 'https://api.testnet.teloscan.io',
        'contractsBucket': 'https://verified-evm-contracts-testnet.s3.amazonaws.com',
        'monitor': 'https://api.monitor-test.telos.net',
    },
    'priceData': {
        'coingeckoId': 'telos',
    },
    'weiPrecision': 18,
    'themes': {
        'light': {
            'primary': '#0099ff',
            'secondary': '#fa9900',
            'accent': '#AA00EE',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#009900',
            'notify-error': '#990000',
            'notify-neutral': '#4D4D4D',
            'notify-info': '#006699',
            'title-image': '/branding/telos-teloscan-logo-testnet.png',
        },
        'dark': {
            'primary': '#00AA77',
            'secondary': '#ffff00',
            'accent': '#ff00ff',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#00FF00',
            'notify-error': '#FF0000',
            'notify-neutral': '#858585',
            'notify-info': '#0099FF',
            'title-image': '/branding/telos-teloscan-logo-testnet--dark.png',
        },
    },
    'tokenListUrl': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json',
    'systemContractsListUrl': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.systemcontractlist.json',
    'socialLinks': [
        {
            'name': 'X (Twitter)',
            'url': 'https://twitter.com/HelloTelos',
            'icon': 'twitter',
            'classSuffix': 'x-twitter',
        },
    ],
    'footerLinks': {
        'chain': 'telos-evm-testnet',
        'branding': {
            'title': 'Telos Testnet',
            'logoLight': '/assets/telos-testnet-logo.png',
            'logoDark': '/assets/telos-testnet-logo--dark.png',
            'url': 'https://testnet.telos.net/',
        },
        'columns': [
            {
                'title': 'components.footer.telos',
                'links': [
                    { 'label': 'components.footer.telos_homepage', 'url': 'https://testnet.telos.net/' },
                    { 'label': 'components.footer.telos_wallet', 'url': 'https://wallet-dev.telos.net/' },
                    { 'label': 'components.footer.telos_bridge', 'url': 'https://telos-bridge-testnet.netlify.app/bridge' },
                ],
            },
            {
                'title': 'components.footer.about',
                'links': [
                    { 'label': 'components.footer.about_us', 'url': 'https://www.telos.net/about' },
                    { 'label': 'components.footer.contactUs', 'url': 'http://t.me/HelloTelos' },
                ],
            },
        ],
    },
    'headerIndicators': {
        'price': false,
        'gasPrice': false,
    },
    'headerMenuConfig': {
        'chain': 'telos-evm-testnet',
        'entries': [
            {
                'label': 'components.header.home',
                'internalLink': 'home',
            },
            {
                'label': 'components.header.blockchain',
                'entries': [
                    {
                        'label': 'components.header.internal_transactions',
                        'internalLink': 'txsinternal',
                    },
                    {
                        'label': 'components.header.transactions',
                        'internalLink': 'transactions',
                    },
                    {
                        'label': 'components.header.blocks',
                        'internalLink': 'blocks',
                    },
                ],
            },
            {
                'label': 'components.header.telos_wallet',
                'externalLink': 'https://wallet-dev.telos.net/',
            },
            {
                'label': 'components.header.telos_bridge',
                'externalLink': 'https://telos-bridge-testnet.netlify.app/bridge',
            },
            {
                'label': 'components.header.more',
                'entries': [
                    {
                        'label': 'global.language',
                        'trigger': 'language',
                        'leftIcon': 'fas fa-language',
                    },
                    {
                        'label': 'components.header.csv_export',
                        'internalLink': 'export',
                    },
                    {
                        'label': 'components.header.health_monitor',
                        'internalLink': 'health',
                    },
                ],
            },
        ],
    },
    'buyMoreTokenLink': 'https://app.telos.net/testnet/evm-faucet',
    'nativeUalChain': {
        'chainId': '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
        'rpcEndpoints': [
            {
                'protocol': 'https',
                'host': 'rpc.testnet.telos.net',
                'port': 443,
            },
        ],
    },
};

export default class TelosEVM extends EVMChainSettings {
    nativeSupport: TelosEvmApi;
    _systemToken: TokenClass = new TokenClass(config.systemTokens[0] as TokenSourceInfo);
    _stakedSystemToken: TokenClass = new TokenClass(config.systemTokens[1] as TokenSourceInfo);
    _wrappedSystemToken: TokenClass = new TokenClass(config.systemTokens[2] as TokenSourceInfo);
    constructor(network: string) {
        super(network);
        this.nativeSupport = new TelosEvmApi({
            endpoint: this.getHyperionEndpoint(),
            chainId: parseInt(this.getChainId()),
            ethPrivateKeys: [],
            telosContract: this.getEscrowContractAddress(),
            telosPrivateKeys: [],
            fetch,
        });
    }

    getNetwork(): string {
        return config.network;
    }

    getChainId(): string {
        return config.chainId;
    }

    isTestnet() {
        return config.isTestnet;
    }

    getDisplay(): string {
        return config.display;
    }

    getBranding(): { text: string; icon: string } {
        return config.branding;
    }

    getApplicationTitle(): string {
        return config.title;
    }

    getHyperionEndpoint(): string {
        return config.apiEndpoints.hyperion;
    }

    getRPCEndpoint(): RpcEndpoint {
        return config.apiEndpoints.rpc;
    }

    getApiEndpoint(): string {
        return config.apiEndpoints.api;
    }

    getPriceData(): Promise<PriceChartData> {
        return getCoingeckoPriceChartData('telos');
    }

    getSystemToken(): TokenClass {
        return this._systemToken;
    }

    getStakedSystemToken(): TokenClass {
        return this._stakedSystemToken;
    }

    getWrappedSystemToken(): TokenClass {
        return this._wrappedSystemToken;
    }

    getEscrowContractAddress(): addressString {
        return config.escrowContractAddress as addressString;
    }

    getHeaderIndicators(): HeaderIndicators {
        return config.headerIndicators;
    }

    async getUsdPrice(): Promise<number> {
        if (this.hasIndexerSupport() && this.isIndexerHealthy()) {
            const nativeTokenSymbol = this.getSystemToken().symbol;
            const fiatCode = useUserStore().fiatCurrency;
            const fiatPrice = await getFiatPriceFromIndexer(nativeTokenSymbol, NativeCurrencyAddress, fiatCode, this.indexer, this);

            if (fiatPrice !== 0) {
                return fiatPrice;
            }
        }

        return await getCoingeckoUsdPrice('telos');
    }

    getLargeLogoPath(): string {
        return config.logos.large;
    }

    getSmallLogoPath(): string {
        return config.logos.small;
    }

    getWeiPrecision(): number {
        return config.weiPrecision;
    }

    getExplorerUrl(): string {
        return config.apiEndpoints.explorer;
    }

    getEcosystemUrl(): string {
        return config.apiEndpoints.ecosystem;
    }

    getThemes(): Themes {
        return config.themes;
    }

    getSocialLinks(): SocialLink[] {
        return config.socialLinks;
    }

    getFooterLinks(): FooterLinksConfig {
        return config.footerLinks;
    }

    getHeaderMenuConfig(): HeaderMenuConfig {
        return config.headerMenuConfig;
    }

    getBridgeUrl(): string {
        return config.apiEndpoints.bridge;
    }

    getTrustedContractsBucket(): string {
        return config.apiEndpoints.contractsBucket;
    }

    getBuyMoreOfTokenLink(): string {
        return config.buyMoreTokenLink;
    }

    getSystemTokens(): TokenClass[] {
        return [
            this.getSystemToken(),
            this.getStakedSystemToken(),
            this.getWrappedSystemToken(),
        ];
    }

    getTokenListUrl(): string {
        return config.tokenListUrl;
    }

    getSystemContractsListUrl(): string {
        return config.systemContractsListUrl;
    }

    getIndexerApiEndpoint(): string {
        return config.apiEndpoints.indexer as string;
    }

    hasIndexerSupport(): boolean {
        return config.apiEndpoints.indexer !== undefined;
    }

    trackAnalyticsEvent(eventName: string): void {
        if (typeof fathom === 'undefined') {
            console.warn(`Failed to track event with name '${eventName}': Fathom Analytics not loaded`);
            return;
        }

        fathom.trackEvent(eventName);
    }

    // teloscan specific
    getNativeSupport(): TelosEvmApi | null {
        return this.nativeSupport;
    }

    getNativeUALChain() {
        return config.nativeUalChain;
    }

    async getEthAccountByNativeAccount(native: string): Promise<string> {
        const account = await this.nativeSupport.telos.getEthAccountByTelosAccount(native);
        if (account) {
            return account.address;
        } else {
            return '';
        }
    }

    getMonitorUrl(): string {
        return config.apiEndpoints.monitor as string;
    }

}
