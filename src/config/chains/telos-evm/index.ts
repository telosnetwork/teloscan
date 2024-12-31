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
    'network': 'telos-evm',
    'display': 'Telos EVM',
    'title': 'TelosEVM Explorer',
    'branding': {
        'text': 'Teloscan',
        'icon': '/branding/telos-scan.png',
    },
    'chainId': '40',
    'isTestnet': false,
    'logos': {
        'large': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
        'small': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
    },
    'systemTokens': [
        {
            'name': 'Telos',
            'symbol': 'TLOS',
            'network': 'telos-evm',
            'decimals': 18,
            'address': NativeCurrencyAddress,
            'logo': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png',
            'isNative': false,
            'isSystem': true,
        },
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
    'escrowContractAddress': '0x95F5713A1422Aa3FBD3DCB8D553945C128ee3855',
    'apiEndpoints': {
        'rpc': {
            'protocol': 'https',
            'host': 'rpc.telos.net',
            'port': 443,
            'path': '/evm',
        },
        'api': 'https://api.telos.net/v1',
        'hyperion': 'https://rpc.telos.net',
        'explorer': 'https://teloscan.io',
        'ecosystem': 'https://www.telos.net/ecosystem',
        'bridge': 'https://bridge.telos.net/bridge',
        'indexer': 'https://api.teloscan.io',
        'contractsBucket': 'https://verified-evm-contracts.s3.amazonaws.com',
        'monitor': 'https://api.monitor-test.telos.net',
    },
    'priceData': {
        'coingeckoId': 'telos',
    },
    'weiPrecision': 18,
    'themes': {
        'light': {
            'primary': '#2a8de3',
            'secondary': '#8B3F98',
            'accent': '#73C58F',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#255B00',
            'notify-error': '#880000',
            'notify-neutral': '#4D4D4D',
            'notify-info': '#008888',
            'title-image': '/branding/telos-teloscan-logo.png',
        },
        'dark': {
            'primary': '#2a8de3',
            'secondary': '#8B3F98',
            'accent': '#73C58F',
            'dark': '#1d1d1d',
            'positive': '#008800',
            'negative': '#880000',
            'info': '#31CCEC',
            'warning': '#F2C037',
            'notify-success': '#469d0d',
            'notify-error': '#b30909',
            'notify-neutral': '#858585',
            'notify-info': '#15baba',
            'title-image': '/branding/telos-teloscan-logo--dark.png',
        },
    },
    'tokenListUrl': 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json',
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
        'chain': 'telos-evm',
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
                    { 'label': 'components.footer.telos_homepage', 'url': 'https://www.telos.net/' },
                    { 'label': 'components.footer.telos_wallet', 'url': 'https://wallet.telos.net/' },
                    { 'label': 'components.footer.telos_bridge', 'url': 'https://bridge.telos.net/bridge' },
                    { 'label': 'components.footer.telos_zero_explorer', 'url': 'https://explorer.telos.net/network' },
                    { 'label': 'components.footer.buy_telos', 'url': 'https://www.telos.net/buy' },
                    { 'label': 'components.footer.stake_telos', 'url': 'https://docs.telos.net/users/knowledge-base/how-to-stake-tlos/' },
                    { 'label': 'components.footer.telos_ecosystem', 'url': 'https://www.telos.net/ecosystem' },
                    { 'label': 'components.footer.network_status', 'url': 'https://www.teloscan.io/health' },
                ],
            },
            {
                'title': 'components.footer.about',
                'links': [
                    { 'label': 'components.footer.about_us', 'url': 'https://www.telos.net/about' },
                    { 'label': 'components.footer.contactUs', 'url': 'http://t.me/HelloTelos' },
                ],
            },
            {
                'title': 'components.footer.build',
                'links': [
                    { 'label': 'components.footer.api_documentation', 'url': 'https://api.teloscan.io/v1/docs' },
                    { 'label': 'components.footer.telos_documentation', 'url': 'https://docs.telos.net/overview/what-is-telos/introduction/' },
                    { 'label': 'components.footer.github', 'url': 'https://github.com/telosnetwork' },
                    { 'label': 'components.footer.brand_assets', 'url': 'https://www.telos.net/community-resources' },
                ],
            },
        ],
    },
    'headerIndicators': {
        'price': true,
        'gasPrice': true,
    },
    'headerMenuConfig': {
        'chain': 'telos-evm',
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
                'label': 'components.header.developers',
                'entries': [
                    {
                        'label': 'components.header.api_documentation',
                        'externalLink': 'https://api.teloscan.io/v1/docs',
                    },
                    {
                        'label': 'components.header.verify_contract_sourcify',
                        'externalLink': 'https://sourcify.dev/',
                    },
                ],
            },
            {
                'label': 'components.header.telos_wallet',
                'externalLink': 'https://wallet.telos.net/',
            },
            {
                'label': 'components.header.telos_bridge',
                'externalLink': 'https://bridge.telos.net/bridge',
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
                    {
                        'label': 'components.header.telos_ecosystem',
                        'externalLink': 'https://www.telos.net/ecosystem',
                    },
                    {
                        'label': 'components.header.telos_zero_explorer',
                        'externalLink': 'https://explorer.telos.net',
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
        return await getCoingeckoUsdPrice(config.priceData.coingeckoId);
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
