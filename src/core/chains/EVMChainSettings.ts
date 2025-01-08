import { RpcEndpoint } from 'universal-authenticator-library';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Method } from 'axios';
import {
    AbiSignature,
    ChainSettings,
    EvmBlockData,
    EvmContractCreationInfo,
    HyperionAbiSignatureFilter,
    IndexerAccountBalances,
    IndexerTokenMarketData,
    PriceChartData,
    IndexerTransactionsFilter,
    IndexerAccountTransactionsResponse,
    TokenClass,
    TokenSourceInfo,
    TokenBalance,
    MarketSourceInfo,
    TokenMarketData,
    IndexerHealthResponse,
    addressString,
    IndexerTransfersFilter,
    IndexerAccountTransfersResponse,
    BrandingType,
} from 'src/core/types';
import EvmContract from 'src/core/stores/utils/contracts/EvmContract';
import { ethers } from 'ethers';
import { toStringNumber } from 'src/core/stores/utils/currency-utils';
import { dateIsWithinXMinutes } from 'src/core/stores/utils/date-utils';
import { createTraceFunction } from 'src/core/mocks/FeedbackStore';
import { getCore } from 'src/core';
import { WEI_PRECISION, PRICE_UPDATE_INTERVAL_IN_MIN } from 'src/core/stores/utils';
import { BehaviorSubject, filter } from 'rxjs';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';

import ContractManager from 'src/lib/contract/ContractManager';
import FragmentParser from 'src/lib/contract/FragmentParser';

// UAL
import { UAL } from 'universal-authenticator-library';
import { Wombat } from 'ual-wombat';
import { Anchor } from 'ual-anchor';


export default abstract class EVMChainSettings implements ChainSettings {
    // to avoid init() being called twice
    protected ready = false;

    protected initPromise: Promise<void>;

    // Short Name of the network
    protected network: string;

    // External query API support
    protected hyperion: AxiosInstance = axios.create({ baseURL: this.getHyperionEndpoint() });

    // External query API support
    protected api: AxiosInstance = axios.create({ baseURL: this.getApiEndpoint() });

    // External trusted metadata bucket for EVM contracts
    protected contractsBucket: AxiosInstance = axios.create({ baseURL: this.getTrustedContractsBucket() });

    // External indexer API support
    protected indexer: AxiosInstance = axios.create({ baseURL: this.getIndexerApiEndpoint() });

    // indexer health check promise
    protected _indexerHealthState: {
        promise: Promise<IndexerHealthResponse> | null;
        state: IndexerHealthResponse
    } = {
            promise: null,
            state: this.deathHealthResponse,
        };

    // Token list promise
    tokenListPromise: Promise<TokenClass[]> | null = null;

    // EvmContracts cache mapped by address
    protected contracts: Record<string, {
        promise: Promise<EvmContract | false>;
        resolve?: (value: EvmContract | false) => void;
    }> = {};

    // this variable helps to show the indexer health warning only once per session
    indexerHealthWarningShown = false;

    // This variable is used to simulate a bad indexer health state
    indexerBadHealthSimulated = false;

    // This observable is used to check if the indexer health state was already checked
    indexerChecked$ = new BehaviorSubject(false);

    // This function is used to trace the execution of the code
    trace = createTraceFunction('EVMChainSettings');

    simulateIndexerDown(isBad: boolean) {
        this.indexerBadHealthSimulated = isBad;
    }

    constructor(network: string) {
        this.network = network;

        const MAX_REQUESTS_COUNT = 5;
        const INTERVAL_MS = 10;
        let pendingRequests = 0;

        // Interceptor handlers -- these handlers are used to limit the number of concurrent requests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestHandler = (value: InternalAxiosRequestConfig) => new Promise<InternalAxiosRequestConfig<any>>((resolve) => {
            const interval = setInterval(() => {
                if (pendingRequests < MAX_REQUESTS_COUNT) {
                    pendingRequests++;
                    clearInterval(interval);
                    resolve(value);
                }
            }, INTERVAL_MS);
        });

        const responseHandler = (response: AxiosResponse<unknown>) => {
            pendingRequests = Math.max(0, pendingRequests - 1);
            return Promise.resolve(response);
        };

        const erorrHandler = (error: unknown) => {
            pendingRequests = Math.max(0, pendingRequests - 1);
            return Promise.reject(error);
        };

        // Axios Request Interceptor
        this.hyperion.interceptors.request.use(requestHandler);
        this.indexer.interceptors.request.use(requestHandler);

        // Axios Response Interceptor
        this.hyperion.interceptors.response.use(responseHandler, erorrHandler);
        this.indexer.interceptors.response.use(responseHandler, erorrHandler);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.indexer.interceptors.response.use(function (response) {
            if(response.data?.abi?.length > 0){
                for (const [key, value] of Object.entries(response.data.abi)) {
                    self.getContractManager().parser.addFunctionInterface(key, value);
                    self.getFragmentParser().addFunctionInterface(key, value);
                }
            }
            if(response.data?.contracts){
                self.getContractManager().addContractsToCache(response.data.contracts);
            }
            return response;
        }, function (error) {
            return Promise.reject(error);
        });

        // Check indexer health state periodically
        this.initPromise = new Promise((resolve) => {
            this.updateIndexerHealthState().finally(() => {
                // we resolve the promise (in any case) that will be returned by init()
                resolve();
            });
        });
    }

    async initialized() {
        return this.initPromise;
    }

    async init(): Promise<void> {
        console.log('init');
        this.trace('init');
        // this is called only when this chain is needed to avoid initialization of all chains
        if (this.ready) {
            return this.initPromise;
        }
        this.ready = true;

        // this setTimeout is a work arround because we can't call getCore() function before it initializes
        setTimeout(() => {
            const timer = setInterval(async () => {
                try {
                    await this.updateIndexerHealthState();
                } catch (e) {
                    clearInterval(timer);
                    console.error('Indexer API not working for this chain:', this.getNetwork(), e);
                }
            }, getCore().config.indexerHealthCheckInterval);
        }, 1000);

        // Update system token price
        this.getUsdPrice().then((value:number) => {
            const sys_token = this.getSystemToken();
            const price = value.toString();
            const marketInfo = { price } as MarketSourceInfo;
            const marketData = new TokenMarketData(marketInfo);
            sys_token.market = marketData;

            const wsys_token = this.getWrappedSystemToken();
            wsys_token.market = marketData;
        });

        return this.initPromise;
    }

    get deathHealthResponse() {
        return {
            success: false,
            blockNumber: 0,
            blockTimestamp: '',
            secondsBehind: Number.POSITIVE_INFINITY,
        } as IndexerHealthResponse;
    }

    async updateIndexerHealthState() {
        // resolve if this chain has indexer api support and is working fine
        const promise =
            Promise.resolve(this.hasIndexerSupport())
                .then(hasIndexerSupport =>
                    hasIndexerSupport ?
                        this.indexer.get('/v1/health') :
                        Promise.resolve({ data: this.deathHealthResponse } as AxiosResponse<IndexerHealthResponse>),
                )
                .then(response => response.data as unknown as IndexerHealthResponse);

        // initial state
        this._indexerHealthState = {
            promise,
            state: this.deathHealthResponse,
        };

        // update indexer health state
        promise.then((state:IndexerHealthResponse) => {
            this._indexerHealthState.state = state;
            this.indexerChecked$.next(true);
        });

        return promise as Promise<IndexerHealthResponse>;
    }

    /**
     * This function checks if the indexer is healthy and warns the user if it is not.
     * This warning should appear only once per session.
     */
    checkAndWarnIndexerHealth() {
        this.indexerChecked$.pipe(
            // This filter only allows to continue if the indexer health was already checked
            filter(indexerChecked => indexerChecked === true),
        ).subscribe(() => {
            if (!this.indexerHealthWarningShown && !this.isIndexerHealthy()) {
                this.indexerHealthWarningShown = true;
                const  ant = getCore();
                ant.config.notifyNeutralMessageHandler(
                    ant.config.localizationHandler('core.chain.indexer_bad_health_warning'),
                );
            }
        });
    }

    isIndexerHealthy(): boolean {
        if (this.indexerBadHealthSimulated) {
            return false;
        } else {
            return (
                this._indexerHealthState.state.success &&
                this._indexerHealthState.state.secondsBehind < getCore().config.indexerHealthThresholdSeconds
            );
        }
    }

    get indexerHealthState(): IndexerHealthResponse {
        return this._indexerHealthState.state;
    }

    isNative() {
        return false;
    }

    getNetwork(): string {
        return this.network;
    }

    getLargeLogoPath(): string {
        return `~/assets/${this.network}/logo_lg.svg`;
    }

    getSmallLogoPath(): string {
        return `~/assets/${this.network}/logo_sm.svg`;
    }

    getTokensLogoURL(): string {
        return `~/assets/${this.network}/tokens`;
    }

    abstract getSystemToken(): TokenClass;
    abstract getStakedSystemToken(): TokenClass;
    abstract getWrappedSystemToken(): TokenClass;
    abstract getEscrowContractAddress(): addressString;
    abstract isTestnet(): boolean;
    abstract getChainId(): string;
    abstract getDisplay(): string;
    abstract getBranding(): BrandingType;
    abstract getHyperionEndpoint(): string;
    abstract getRPCEndpoint(): RpcEndpoint;
    abstract getApiEndpoint(): string;
    abstract getPriceData(): Promise<PriceChartData>;
    abstract getUsdPrice(): Promise<number>;
    abstract getBuyMoreOfTokenLink(): string;
    abstract getWeiPrecision(): number;
    abstract getExplorerUrl(): string;
    abstract getEcosystemUrl(): string;
    abstract getBridgeUrl(): string;
    abstract getTrustedContractsBucket(): string;
    abstract getSystemTokens(): TokenClass[];
    abstract getIndexerApiEndpoint(): string;
    abstract hasIndexerSupport(): boolean;

    async getApy(): Promise<string> {
        const response = await this.api.get('apy/evm');
        return response.data as string;
    }

    async getBalances(account: string): Promise<TokenBalance[]> {
        this.trace('getBalances', account);
        if (!this.hasIndexerSupport()) {
            console.error('Indexer API not supported for this chain:', this.getNetwork());
            return [];
        }
        return Promise.all([
            this.indexer.get(`v1/account/${account}/balances`, {
                params: {
                    limit: 50,
                    offset: 0,
                    includePagination: false,
                },
            }),
            this.getUsdPrice(),
        ]).then(async ([response, systemTokenPrice]) => {
            // parse to IndexerAccountBalances
            const balances = response.data as IndexerAccountBalances;

            const tokenList = await this.getTokenList();
            const tokens: TokenBalance[] = [];

            for (const result of balances.results) {
                const token = tokenList.find(t => t.address.toLowerCase() === result.contract.toLowerCase());
                const contractData = balances.contracts[result.contract] ?? {};
                // fixing calldata
                const callDataStr = contractData.calldata as string | object ?? '{}';

                try {
                    if (typeof callDataStr === 'string') {
                        contractData.calldata = JSON.parse(callDataStr);
                    } else if (token?.isSystem) {
                        // system token systemTokenPrice
                        contractData.calldata = {
                            price: systemTokenPrice,
                        } as IndexerTokenMarketData;
                    }
                } catch (e) {
                    console.error('Error parsing calldata', `"${callDataStr}"`, e);
                }

                if (token) {
                    const balance = ethers.BigNumber.from(result.balance);
                    const tokenBalance = new TokenBalance(token, balance);
                    tokens.push(tokenBalance);
                    const priceIsCurrent =
                        !!contractData.calldata?.marketdata_updated &&
                        dateIsWithinXMinutes(+contractData.calldata?.marketdata_updated, PRICE_UPDATE_INTERVAL_IN_MIN);

                    // If we have market data we use it, as long as the price was updated within the last 10 minutes
                    if (typeof contractData.calldata === 'object' && priceIsCurrent) {
                        const price = (+(contractData.calldata.price ?? 0)).toFixed(12);
                        const marketInfo = { ...contractData.calldata, price } as MarketSourceInfo;
                        const marketData = new TokenMarketData(marketInfo);
                        token.market = marketData;
                    }
                }
            }
            return tokens;
        }).catch((error) => {
            console.error(error);
            return [];
        });
    }

    constructTokenId(token: TokenSourceInfo): string {
        return `${token.symbol}-${token.address}-${this.getNetwork()}`;
    }

    async getEVMTransactions(filter: IndexerTransactionsFilter): Promise<IndexerAccountTransactionsResponse> {
        const address = filter.address;
        const limit = filter.limit;
        const offset = filter.offset;
        const includeAbi = filter.includeAbi;
        const sort = filter.sort;
        const includePagination = true;
        const logTopic = filter.logTopic;
        const full = filter.full ?? true;

        let aux = {};

        if (limit !== undefined) {
            aux = { limit, ...aux };
        }
        if (offset !== undefined) {
            aux = { offset, ...aux };
        }
        if (includeAbi !== undefined) {
            aux = { includeAbi, ...aux };
        }
        if (sort !== undefined) {
            aux = { sort, ...aux };
        }
        if (includePagination !== undefined) {
            aux = { includePagination, ...aux };
        }
        if (logTopic !== undefined) {
            aux = { logTopic, ...aux };
        }
        if (full !== undefined) {
            aux = { full, ...aux };
        }

        const params: AxiosRequestConfig = aux as AxiosRequestConfig;
        const url = `v1/address/${address}/transactions`;

        // The following performs a GET request to the indexer endpoint.
        // Then it pipes the response to the IndexerAccountTransactionsResponse type.
        // Notice that the promise is not awaited, but returned instead immediately.
        return this.indexer.get(url, { params })
            .then(response => response.data as IndexerAccountTransactionsResponse);
    }

    async getEvmNftTransfers({
        account,
        type,
        limit,
        offset,
        includePagination,
        endBlock,
        startBlock,
        contract,
        includeAbi,
    }: IndexerTransfersFilter): Promise<IndexerAccountTransfersResponse> {
        let aux = {};

        if (limit !== undefined) {
            aux = { limit, ...aux };
        }
        if (offset !== undefined) {
            aux = { offset, ...aux };
        }
        if (includeAbi !== undefined) {
            aux = { includeAbi, ...aux };
        }
        if (type !== undefined) {
            aux = { type, ...aux };
        }
        if (includePagination !== undefined) {
            aux = { includePagination, ...aux };
        }
        if (endBlock !== undefined) {
            aux = { endBlock, ...aux };
        }
        if (startBlock !== undefined) {
            aux = { startBlock, ...aux };
        }
        if (contract !== undefined) {
            aux = { contract, ...aux };
        }

        const params = aux as AxiosRequestConfig;
        const url = `v1/account/${account}/transfers`;

        return this.indexer.get(url, { params })
            .then(response => response.data as IndexerAccountTransfersResponse)
            .then((data) => {
                // set supportedInterfaces property if undefined in the response
                Object.values(data.contracts as unknown as { supportedInterfaces: null | string[] }[]).forEach((contract) => {
                    if (contract.supportedInterfaces === null && type !== undefined) {
                        contract.supportedInterfaces = [type as string];
                    }
                });
                return data;
            });
    }

    async getTokenList(): Promise<TokenClass[]> {
        if (this.tokenListPromise) {
            return this.tokenListPromise;
        }

        const url =  'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
        this.tokenListPromise = axios.get(url)
            .then(results => results.data.tokens as unknown as {chainId:number, logoURI: string}[])
            .then(tokens => tokens.filter(({ chainId }) => chainId === +this.getChainId()))
            .then(tokens => tokens.map(t => ({
                ...t,
                network: this.getNetwork(),
                logoURI: t.logoURI?.replace('ipfs://', 'https://w3s.link/ipfs/') ?? require('src/assets/tokens/telos.png'),
            }) as unknown as TokenSourceInfo))
            .then(tokens => tokens.map(t => new TokenClass(t)))
            .then(tokens => [this.getSystemToken(), this.getWrappedSystemToken(), this.getStakedSystemToken(), ...tokens]);

        return this.tokenListPromise;
    }

    async getAbiSignature(filter: HyperionAbiSignatureFilter): Promise<AbiSignature> {
        const params: AxiosRequestConfig = filter as AxiosRequestConfig;
        return this.hyperion.get('/v2/evm/get_abi_signature', { params })
            .then(response => response.data as AbiSignature);
    }

    async fetchContractCreationInfo(address: string): Promise<EvmContractCreationInfo> {
        return this.hyperion.get(`/v2/evm/get_contract?contract=${address}`)
            .then(response => response.data as EvmContractCreationInfo);
    }

    async getContractMetadata(checksumAddress: string): Promise<string> {
        return this.contractsBucket.get(`${checksumAddress}/metadata.json`)
            .then(response => response.data.content as string);
    }

    rpcCounter = 0;
    nextId(): number {
        return ++this.rpcCounter;
    }

    async doRPC<T>({ method, params }: AxiosRequestConfig): Promise<T> {
        const rpcPayload = {
            jsonrpc: '2.0',
            id: this.nextId(),
            method,
            params,
        };
        return this.hyperion.post('/evm', rpcPayload)
            .then(response => response.data as T);
    }

    getIndexer() {
        return this.indexer;
    }

    async getGasPrice(): Promise<ethers.BigNumber> {
        return this.doRPC<{result:string}>({
            method: 'eth_gasPrice' as Method,
            params: [],
        }).then(response => ethers.BigNumber.from(response.result));
    }

    async getEstimatedGas(limit: number): Promise<{ system:ethers.BigNumber, fiat:ethers.BigNumber }> {
        const gasPrice: ethers.BigNumber = await this.getGasPrice();
        const tokenPrice: number = await this.getUsdPrice();
        const price = ethers.utils.parseUnits(toStringNumber(tokenPrice), WEI_PRECISION);
        const system = gasPrice.mul(limit);
        const fiatDouble = system.mul(price);
        const fiat = fiatDouble.div(ethers.utils.parseUnits('1', WEI_PRECISION));
        return { system, fiat };
    }
    async getLatestBlock(): Promise<ethers.BigNumber> {
        return this.doRPC<{result:string}>({
            method: 'eth_blockNumber' as Method,
            params: [],
        }).then(response => ethers.BigNumber.from(response.result));
    }

    async getBlockByNumber(blockNumber: string): Promise<EvmBlockData> {
        return this.doRPC<{result:EvmBlockData}>({
            method: 'eth_getBlockByNumber' as Method,
            params: [parseInt(blockNumber).toString(16), false],
        }).then((response) => {
            console.error('type of response.result', typeof response.result, [response.result]);
            return response.result as EvmBlockData;
        });
    }

    // --------- Teloscan specific ---------
    getIndexerApi(): AxiosInstance {
        return this.indexer;
    }
    getTelosApi(): AxiosInstance {
        return this.api;
    }
    getHyperionApi(): AxiosInstance {
        return this.hyperion;
    }
    // MUST be overridden by the chain
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getEthAccountByNativeAccount(native: string): Promise<string> {
        throw new Error('Feature not supported for this network (' + native + ')');
    }
    getNativeSupport(): TelosEvmApi | null {
        return null;
    }

    // -- contract manager --
    contractManager: ContractManager | null = null;
    fragmentParser: FragmentParser | null = null;
    private createContractManager(): ContractManager {
        this.contractManager = new ContractManager(this.indexer, this.getFragmentParser());
        return this.contractManager;
    }
    getContractManager(): ContractManager {
        if (!this.contractManager) {
            return this.createContractManager();
        } else {
            return this.contractManager;
        }
    }
    getFragmentParser(): FragmentParser {
        if (!this.fragmentParser) {
            this.fragmentParser = new FragmentParser(this.hyperion);
        }
        return this.fragmentParser;
    }

    ual: UAL | null = null;
    getNativeUALChain(): { chainId: string, rpcEndpoints: RpcEndpoint[] } | null {
        return null;
    }
    getUAL(): UAL | null {
        if (!this.ual) {
            const chain = this.getNativeUALChain();
            if (!chain) {
                return null;
            } else {
                const authenticators = [
                    new Anchor([chain], { appName: process.env.APP_NAME as string }),
                    new Wombat([chain], { appName: process.env.APP_NAME as string }),
                ];
                this.ual = new UAL([chain], 'ual', authenticators);
            }
        }
        return this.ual;
    }
}
