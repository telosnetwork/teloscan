import EVMChainSettings from 'src/antelope/chains/EVMChainSettings';
import { RpcEndpoint } from 'universal-authenticator-library';
import { NativeCurrencyAddress, PriceChartData, addressString } from 'src/antelope/types';
import { TokenClass, TokenSourceInfo } from 'src/antelope/types';
import { useUserStore } from 'src/antelope';
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
