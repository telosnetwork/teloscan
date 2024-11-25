import EVMChainSettings from 'src/core/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { FooterLinksConfig, HeaderMenuConfig, NativeCurrencyAddress, PriceChartData, SocialLink, Themes, addressString } from 'src/core/types';
import { TokenClass, TokenSourceInfo } from 'src/core/types';
import { useUserStore } from 'src/core';
import { getFiatPriceFromIndexer, getCoingeckoPriceChartData, getCoingeckoUsdPrice } from 'src/lib/price';

// specific for Telos
import { TelosEvmApi } from '@telosnetwork/telosevm-js';

const LOGO = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/telos.png';
const CHAIN_ID = '40';
export const NETWORK = 'telos-evm';
const DISPLAY = 'Telos EVM';
const TOKEN = new TokenClass({
    name: 'Telos',
    symbol: 'TLOS',
    network: NETWORK,
    decimals: 18,
    address: NativeCurrencyAddress,
    logo: LOGO,
    logoURI: LOGO,
    isNative: false,
    isSystem: true,
} as TokenSourceInfo);

const S_TOKEN = new TokenClass({
    name: 'Staked Telos',
    symbol: 'STLOS',
    network: NETWORK,
    decimals: 18,
    address: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
    logo: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/stlos.png',
    isNative: false,
    isSystem: false,
} as TokenSourceInfo);

const W_TOKEN = new TokenClass({
    name: 'Wrapped Telos',
    symbol: 'WTLOS',
    network: NETWORK,
    decimals: 18,
    address: '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E',
    logo: 'https://raw.githubusercontent.com/telosnetwork/token-list/main/logos/wtlos.png',
    isNative: false,
    isSystem: false,
} as TokenSourceInfo);

const RPC_ENDPOINT = {
    protocol: 'https',
    host: 'mainnet.telos.net',
    port: 443,
    path: '/evm',
};
const ESCROW_CONTRACT_ADDRESS = '0x95F5713A1422Aa3FBD3DCB8D553945C128ee3855';
const API_ENDPOINT = 'https://api.telos.net/v1';
const WEI_PRECISION = 18;
const EXPLORER_URL = 'https://teloscan.io';
const ECOSYSTEM_URL = 'https://www.telos.net/ecosystem';
const BRIDGE_URL = 'https://bridge.telos.net/bridge';
const NETWORK_EVM_ENDPOINT = 'https://mainnet.telos.net';
const INDEXER_ENDPOINT = 'https://api.teloscan.io';
const CONTRACTS_BUCKET = 'https://verified-evm-contracts.s3.amazonaws.com';

declare const fathom: { trackEvent: (eventName: string) => void };

// UAL chain
const NETWORK_CHAIN_ID = '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11';
const NETWORK_PROTOCOL = 'https';
const NETWORK_PORT = 443;
const NETWORK_HOST = 'mainnet.telos.net';

export default class TelosEVM extends EVMChainSettings {
    nativeSupport: TelosEvmApi;
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
        console.assert(network === NETWORK, `Network name mismatch: '${network}' !== '${NETWORK}'`);
    }

    getNetwork(): string {
        return NETWORK;
    }

    getChainId(): string {
        return CHAIN_ID;
    }

    getDisplay(): string {
        return DISPLAY;
    }

    getHyperionEndpoint(): string {
        return NETWORK_EVM_ENDPOINT;
    }

    getRPCEndpoint(): RpcEndpoint {
        return RPC_ENDPOINT;
    }

    getApiEndpoint(): string {
        return API_ENDPOINT;
    }

    getPriceData(): Promise<PriceChartData> {
        return getCoingeckoPriceChartData('telos');
    }

    getSystemToken(): TokenClass {
        return TOKEN;
    }

    getStakedSystemToken(): TokenClass {
        return S_TOKEN;
    }

    getWrappedSystemToken(): TokenClass {
        return W_TOKEN;
    }

    getEscrowContractAddress(): addressString {
        return ESCROW_CONTRACT_ADDRESS;
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
        return LOGO;
    }

    getSmallLogoPath(): string {
        return LOGO;
    }

    getWeiPrecision(): number {
        return WEI_PRECISION;
    }

    getExplorerUrl(): string {
        return EXPLORER_URL;
    }

    getEcosystemUrl(): string {
        return ECOSYSTEM_URL;
    }

    getThemes(): Themes {
        return {
            light: {
                primary: '#2a8de3',
                secondary: '#8B3F98',
                accent: '#73C58F',
                dark: '#1d1d1d',
                positive: '#008800',
                negative: '#880000',
                info: '#31CCEC',
                warning: '#F2C037',
                'notify-success': '#255B00',
                'notify-error': '#880000',
                'notify-neutral': '#4D4D4D',
                'notify-info': '#008888',
            },
            dark: {
                primary: '#2a8de3',
                secondary: '#8B3F98',
                accent: '#73C58F',
                dark: '#1d1d1d',
                positive: '#008800',
                negative: '#880000',
                info: '#31CCEC',
                warning: '#F2C037',
                'notify-success': '#469d0d',
                'notify-error': '#b30909',
                'notify-neutral': '#858585',
                'notify-info': '#15baba',
            },
        };
    }

    getSocialLinks(): SocialLink[] {
        return [
            {
                name: 'Telegram',
                url: 'http://t.me/HelloTelos',
                icon: 'telegram',
                classSuffix: 'telegram',
            },
            {
                name: 'X (Twitter)',
                url: 'https://twitter.com/HelloTelos',
                icon: 'twitter',
                classSuffix: 'x-twitter',
            },
            {
                name: 'YouTube',
                url: 'https://www.youtube.com/@TheTelosNetwork',
                icon: 'youtube',
                classSuffix: 'youtube',
            },
            {
                name: 'Discord',
                url: 'https://discord.gg/telos',
                icon: 'discord',
                classSuffix: 'discord',
            },
        ];
    }

    getFooterLinks(): FooterLinksConfig {
        return {
            chain: 'telos-evm',
            branding: {
                title: 'Telos Testnet',
                logoLight: '/assets/telos-new-logo.png',
                logoDark: '/assets/telos-new-logo--dark.png',
                url: 'https://testnet.telos.net/',
            },
            columns: [
                {
                    title: 'components.footer.telos',
                    links: [
                        { label: 'components.footer.telos_homepage', url: 'https://www.telos.net/' },
                        { label: 'components.footer.telos_wallet', url: 'https://wallet.telos.net/' },
                        { label: 'components.footer.telos_bridge', url: 'https://bridge.telos.net/bridge' },
                        { label: 'components.footer.telos_zero_explorer', url: 'https://explorer.telos.net/network' },
                        { label: 'components.footer.buy_telos', url: 'https://www.telos.net/buy' },
                        { label: 'components.footer.stake_telos', url: 'https://docs.telos.net/users/knowledge-base/how-to-stake-tlos/' },
                        { label: 'components.footer.telos_ecosystem', url: 'https://www.telos.net/ecosystem' },
                        { label: 'components.footer.network_status', url: 'https://www.teloscan.io/health' },
                    ],
                },
                {
                    title: 'components.footer.about',
                    links: [
                        { label: 'components.footer.about_us', url: 'https://www.telos.net/about' },
                        { label: 'components.footer.contactUs', url: 'http://t.me/HelloTelos' },
                    ],
                },
                {
                    title: 'components.footer.build',
                    links: [
                        { label: 'components.footer.api_documentation', url: 'https://api.teloscan.io/v1/docs' },
                        { label: 'components.footer.telos_documentation', url: 'https://docs.telos.net/overview/what-is-telos/introduction/' },
                        { label: 'components.footer.github', url: 'https://github.com/telosnetwork' },
                        { label: 'components.footer.brand_assets', url: 'https://www.telos.net/community-resources' },
                    ],
                },
            ],
        };
    }

    getHeaderMenuConfig(): HeaderMenuConfig {
        return {
            chain: 'telos-evm',
            entries: [
                {
                    label: 'components.header.home',
                    internalLink: 'home',
                },
                {
                    label: 'components.header.blockchain',
                    entries: [
                        {
                            label: 'components.header.internal_transactions',
                            internalLink: 'txsinternal',
                        },
                        {
                            label: 'components.header.transactions',
                            internalLink: 'transactions',
                        },
                        {
                            label: 'components.header.blocks',
                            internalLink: 'blocks',
                        },
                    ],
                },
                {
                    label: 'components.header.developers',
                    entries: [
                        {
                            label: 'components.header.api_documentation',
                            externalLink: 'https://api.teloscan.io/v1/docs',
                        },
                        {
                            label: 'components.header.verify_contract_sourcify',
                            externalLink: 'https://sourcify.dev/',
                        },
                    ],
                },
                {
                    label: 'components.header.telos_wallet',
                    externalLink: 'https://wallet.telos.net/',
                },
                {
                    label: 'components.header.telos_bridge',
                    externalLink: 'https://bridge.telos.net/bridge',
                },
                {
                    label: 'components.header.more',
                    entries: [
                        {
                            label: 'global.language',
                            trigger: 'language',
                            leftIcon: 'fas fa-language',
                        },
                        {
                            label: 'components.header.csv_export',
                            internalLink: 'export',
                        },
                        {
                            label: 'components.header.health_monitor',
                            internalLink: 'health',
                        },
                        {
                            label: 'components.header.telos_ecosystem',
                            externalLink: 'https://www.telos.net/ecosystem',
                        },
                        {
                            label: 'components.header.telos_zero_explorer',
                            externalLink: 'https://explorer.telos.net',
                        },
                    ],
                },
            ],
        };
    }

    getBridgeUrl(): string {
        return BRIDGE_URL;
    }

    getTrustedContractsBucket(): string {
        return CONTRACTS_BUCKET;
    }

    getBuyMoreOfTokenLink(): string {
        return 'https://www.telos.net/buy';
    }

    getSystemTokens(): TokenClass[] {
        return [TOKEN, S_TOKEN, W_TOKEN];
    }

    getIndexerApiEndpoint(): string {
        return INDEXER_ENDPOINT;
    }

    hasIndexerSupport(): boolean {
        return true;
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
        return {
            chainId: NETWORK_CHAIN_ID,
            rpcEndpoints: [
                {
                    protocol: NETWORK_PROTOCOL,
                    host: NETWORK_HOST,
                    port: NETWORK_PORT,
                },
            ],
        };
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
        return 'https://api.monitor-test.telos.net';
    }

}
