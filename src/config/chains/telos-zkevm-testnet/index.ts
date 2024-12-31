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
    'network': 'telos-zkevm-testnet',
    'display': 'TelosZKEVM (Testnet)',
    'title': 'Telos zkEVM Testnet Explorer',
    'branding': {
        'text': 'zkEVM',
        'icon': '/branding/teloszk-icon.png',
    },
    'chainId': '1310',
    'isTestnet': true,
    'logos': {
        'large': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos-zkevm-logo-256.png',
        'small': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos-zkevm-logo-32.png',
    },
    'systemTokens': [
        {
            'name': 'Telos ZKEVM',
            'symbol': 'tTLOS',
            'network': 'telos-zkevm-testnet',
            'decimals': 18,
            'address': NativeCurrencyAddress,
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos-zkevm-logo-32.png',
            'isNative': false,
            'isSystem': true,
        },
        // FIXME: missing staked and wrapped tokens. Do they even exist?
        {
            'name': 'Staked Telos',
            'symbol': 'STLOS',
            'network': 'telos-evm',
            'decimals': 18,
            'address': '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/stlos.png',
            'isNative': false,
            'isSystem': false,
        },
        {
            'name': 'Wrapped Telos',
            'symbol': 'WTLOS',
            'network': 'telos-evm',
            'decimals': 18,
            'address': '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E',
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/wtlos.png',
            'isNative': false,
            'isSystem': false,
        },
    ],
    // FIXME: missing escrowContractAddress
    'escrowContractAddress': '',
    'apiEndpoints': {
        'rpc': {
            'protocol': 'https',
            'host': 'zkrpc.testnet.telos.net',
            'port': 443,
            'path': '',
        },
        'api': 'https://api.telos.net/v1',
        'hyperion': 'https://mainnet.telos.net/',
        'explorer': 'https://zktest.teloscan.io',
        'ecosystem': 'https://www.telos.net/ecosystem',
        'bridge': 'https://bridge.telos.net/bridge',
        'indexer': 'https://api.zktest.teloscan.io/',
        'contractsBucket': 'https://verified-evm-contracts.s3.amazonaws.com',
        'monitor': 'https://api.monitor-test.telos.net',
    },
    'priceData': {
        'coingeckoId': 'telos',
    },
    'weiPrecision': 18,
    'themes': {
        'light': {
            'primary': '#4b95aa',
            'secondary': '#5b8cde',
            'accent': '#ffa1e4',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#255B00',
            'notify-error': '#880000',
            'notify-neutral': '#4D4D4D',
            'notify-info': '#008888',
            'title-image': '/branding/teloszk-teloscan-logo-testnet.png',
        },
        'dark': {
            'primary': '#4b95aa',
            'secondary': '#5b8cde',
            'accent': '#ffa1e4',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#469d0d',
            'notify-error': '#b30909',
            'notify-neutral': '#858585',
            'notify-info': '#15baba',
            'title-image': '/branding/teloszk-teloscan-logo-testnet--dark.png',
        },
    },
    'tokenListUrl': 'https://raw.githubusercontent.com/telosnetwork/token-list/refs/heads/main/teloszkevm.tokenlist.json',
    'systemContractsListUrl': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.systemcontractlist.json',
    'socialLinks': [
        {
            'name': 'Telegram',
            'url': 'http://t.me/HelloTelos',
            'icon': 'telegram',
            'classSuffix': 'telegram',
        },
        {
            'name': 'X (Twitter)',
            'url': 'https://twitter.com/HelloTelos',
            'icon': 'twitter',
            'classSuffix': 'x-twitter',
        },
        {
            'name': 'YouTube',
            'url': 'https://www.youtube.com/@TheTelosNetwork',
            'icon': 'youtube',
            'classSuffix': 'youtube',
        },
        {
            'name': 'Discord',
            'url': 'https://discord.gg/telos',
            'icon': 'discord',
            'classSuffix': 'discord',
        },
    ],
    'footerLinks': {
        'chain': 'telos-zkevm-testnet',
        'branding': {
            'title': 'Telos Testnet',
            'logoLight': '/assets/telos-new-logo.png',
            'logoDark': '/assets/telos-new-logo--dark.png',
            'url': 'https://testnet.telos.net/',
        },
        'columns': [
            {
                'title': 'components.footer.telos',
                'links': [
                    { 'label': 'components.footer.telos_homepage', 'url': 'https://zkevm.telos.net/' },
                ],
            },
            {
                'title': 'components.footer.about',
                'links': [
                    { 'label': 'components.footer.about_us', 'url': 'https://zkevm.telos.net/' },
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
        'chain': 'telos-zkevm-testnet',
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
                'label': 'components.header.more',
                'entries': [
                    {
                        'label': 'global.language',
                        'trigger': 'language',
                        'leftIcon': 'fas fa-language',
                    },
                ],
            },
        ],
    },
    'buyMoreTokenLink': 'https://www.telos.net/buy',
    'nativeUalChain': {
        'chainId': '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
        'rpcEndpoints': [
            {
                'protocol': 'https',
                'host': 'rpc.telos.net',
                'port': 443,
            },
        ],
    },
};

export default class TelosZkEVM extends EVMChainSettings {
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
