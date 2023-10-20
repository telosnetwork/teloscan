import { ethers } from 'ethers';
import { toStringNumber } from 'src/antelope/wallets/utils/currency-utils';
import { WEI_PRECISION, formatWei } from 'src/antelope/wallets/utils';

export const TOKEN_PRICE_DECIMALS = 18;

// A type to represent the possible EVM token types
export const ERC20_TYPE   = 'ERC20';
export const ERC721_TYPE  = 'ERC721';
export const ERC1155_TYPE = 'ERC1155';
export const ERC777_TYPE  = 'ERC777';
export const ERC827_TYPE  = 'ERC827';
export const ERC1400_TYPE = 'ERC1400';
export const ERC223_TYPE  = 'ERC223';
export type EvmTokenType =
    typeof ERC20_TYPE    |
    typeof ERC721_TYPE   |
    typeof ERC1155_TYPE  |
    typeof ERC777_TYPE   |
    typeof ERC827_TYPE   |
    typeof ERC1400_TYPE;

// MarketSourceInfo is a type to represent all the information that can be retrieved from the market API
// It is used to creat a TokenMarketData class object
export interface MarketSourceInfo {
    volume?: string;                       // ej: '20637702616.664093',
    maxGlobalSupply?: never;               // ej: null ¿?
    networkSupply?: string;                // ej: '554177.374691',
    symbol?: string;                       // ej: 'USDT',
    marketcap?: string;                    // ej: '82852725529.35149',
    address?: string;                      // ej: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
    holders?: string;                      // ej: '509',
    price: string;                         // ej: '1.000089',
    decimals?: number;                     // ej: 6,
    globalSupply?: string;                 // ej: '86090638895.068830',
    updated?: string;                      // ej: '1684330029866'
}

// A type to represent the source information for a token
// It is used to create a Token class object
export interface TokenSourceInfo {
    symbol: string;                        // Token symbol
    contract?: string;                     // Token contract account name (for native)
    address?: string;                      // Token contract address (for EVM)
    chainId: string;                       // Chain ID (40 & 41 for Telos EVM) or hash (for native)
    network: string;                       // short name of the network (used for the token id)
    name: string;                          // Token name (as a title)
    decimals?: number;                     // Token amount of digits after the decimal point (as used in EVM)
    precision?: number;                    // Token amount of digits after the decimal point (as used in native)
    type?: EvmTokenType;                   // Token type (ERC20, ERC721, etc.)
    logo?: string;                         // Token logo uri (as used in native)
    logoURI?: string;                      // Token logo uri (as used in EVM)
    metadata?: string;                     // Token contract metadata (as used in EVM)
    isSystem: boolean;                     // True if the token is the main system token
    isNative: boolean;                     // True if the token is a Antelope native blockchain token (false for EVM)
    amount?: number | string;              // posible balance amount
    balance?: string;                      // posible balance amount
    fullBalance?: string;                  // posible balance amount
}

// A class to represent the price market information for a token
export class TokenMarketData {
    readonly info: MarketSourceInfo;        // Market information
    private _price: ethers.BigNumber;       // pre calculated Token price

    constructor(sourceInfo: MarketSourceInfo) {
        this.info = sourceInfo;
        try {
            this._price = ethers.utils.parseUnits(sourceInfo.price, TOKEN_PRICE_DECIMALS);
        } catch (e) {
            this._price = ethers.constants.Zero;
        }
    }

    // Returns the token price
    get price(): ethers.BigNumber {
        return this._price;
    }
}

export class TokenPrice {
    readonly market: TokenMarketData | null;
    constructor(market: TokenMarketData | null) {
        if (market?.price.gt(ethers.constants.Zero)) {
            this.market = market;
        } else {
            this.market = null;
        }
    }

    get decimals(): number {
        return this.market?.info.decimals || TOKEN_PRICE_DECIMALS;
    }

    // Returns the token price as BigNumber
    get value(): ethers.BigNumber {
        return this.market?.price || ethers.constants.Zero;
    }

    // Returns the token price as string containing a float number
    get str(): string {
        return ethers.utils.formatUnits(this.value, TOKEN_PRICE_DECIMALS);
    }

    // Returns the inverse of the token price as BigNumber
    get inverse(): ethers.BigNumber {
        return ethers.utils.parseUnits('1', TOKEN_PRICE_DECIMALS * 2).div(this.value);
    }

    // Returns the inverse of the token price as string containing a float number
    get inverseStr(): string {
        return ethers.utils.formatUnits(this.inverse, TOKEN_PRICE_DECIMALS);
    }

    get isAvailable(): boolean {
        return this.market !== null && this.market.price.gt(ethers.constants.Zero);
    }

    // this supports the token.price.toString() expression
    toString(): string {
        return this.value.toString();
    }


    // this function transforms a token amount into fiat amount and returns it as BigNumber
    getAmountInFiat(tokensAmount: string | number | ethers.BigNumber): ethers.BigNumber {
        // get the BigNumber value
        let tokensAmountBn: ethers.BigNumber = ethers.constants.Zero;
        if (typeof tokensAmount === 'string' || typeof tokensAmount === 'number') {
            tokensAmountBn = ethers.utils.parseUnits(toStringNumber(tokensAmount), this.decimals);
        } else {
            tokensAmountBn = tokensAmount;
        }
        const fiatAmount = tokensAmountBn.mul(this.value).div(ethers.utils.parseUnits('1', this.decimals));
        return fiatAmount;
    }

    // this function transforms a token amount into fiat amount and returns it as string containing a float number
    getAmountInFiatStr(tokensAmount: string | number | ethers.BigNumber, decimals = 2): string {
        return `${formatWei(this.getAmountInFiat(tokensAmount), TOKEN_PRICE_DECIMALS, decimals)}`;
    }

    // this function transforms a fiat amount into token amount and returns it as BigNumber
    getAmountInTokens(fiatAmount: string | number | ethers.BigNumber): ethers.BigNumber {
        // get the BigNumber value
        let fiatAmountBn: ethers.BigNumber = ethers.constants.Zero;
        if (typeof fiatAmount === 'string' || typeof fiatAmount === 'number') {
            fiatAmountBn = ethers.utils.parseUnits(toStringNumber(fiatAmount), this.decimals);
        } else {
            fiatAmountBn = fiatAmount;
        }
        const tokensAmount = fiatAmountBn.mul(ethers.utils.parseUnits('1', this.decimals)).div(this.value);
        return tokensAmount;
    }

    // this function transforms a fiat amount into token amount and returns it as string containing a float number
    getAmountInTokensStr(fiatAmount: string | number | ethers.BigNumber, decimals = 2): string {
        return `${formatWei(this.getAmountInTokens(fiatAmount), this.decimals, decimals)}`;
    }

    // this function transforms a token amount into another given token amount and returns it as BigNumber
    getAmountInThisToken(tokensAmount: string | number | ethers.BigNumber, targetToken: TokenClass): ethers.BigNumber {
        // get the BigNumber value
        let tokensAmountBn: ethers.BigNumber = ethers.constants.Zero;
        if (typeof tokensAmount === 'string' || typeof tokensAmount === 'number') {
            tokensAmountBn = ethers.utils.parseUnits(toStringNumber(tokensAmount), this.decimals);
        } else {
            tokensAmountBn = tokensAmount;
        }
        const targetAmount = tokensAmountBn.mul(this.value).div(targetToken.price.value);
        return targetAmount;
    }
}

// A class to represent a blockchain token
export class TokenClass implements TokenSourceInfo {
    readonly id: string;            // Unique ID for the token <symbol>-<contract>-<chainId>
    readonly symbol: string;        // Token symbol
    readonly name: string;          // Token name (as a title)
    readonly logo?: string;         // Token logo uri
    readonly contract: string;      // Token contract address (for EVM) or account name (for native)
    readonly chainId: string;       // Chain ID (40 & 41 for Telos EVM) or hash (for native)
    readonly network: string;       // short name of the network (used for the token id)
    readonly decimals: number;      // Token amount of digits after the decimal point (same as precision for native)
    readonly isSystem: boolean;     // True if the token is the system token
    readonly isNative: boolean;     // True if the token is a native blockchain token
    readonly type: EvmTokenType;    // Token type (ERC20, ERC721, etc.)
    private _price: TokenPrice;     // Token price object

    constructor(sourceInfo: TokenSourceInfo) {
        this.symbol = sourceInfo.symbol;
        this.contract = sourceInfo.contract ?? sourceInfo.address ?? '';
        this.chainId = sourceInfo.chainId;
        this.network = sourceInfo.network;
        this.name = sourceInfo.name;
        this.decimals = sourceInfo.decimals ?? sourceInfo.precision ?? WEI_PRECISION;
        this.isSystem = sourceInfo.isSystem;
        this.isNative = sourceInfo.isNative;
        this.logo = sourceInfo.logo ?? sourceInfo.logoURI;
        this.type = (sourceInfo.type?.toUpperCase() ?? ERC20_TYPE) as EvmTokenType;
        this.id = `${this.symbol}-${this.contract}-${this.network}`;
        this._price = new TokenPrice(null);
    }

    // Sets the market data for the token to update token price
    set market(market: TokenMarketData | null) {
        this._price = new TokenPrice(market);
    }

    get market(): TokenMarketData | null {
        return this._price.market;
    }

    // Returns the URI for the token logo
    get logoURI(): string | undefined {
        return this.logo;
    }

    get address(): string {
        return this.contract;
    }

    get precision(): number {
        return this.decimals;
    }

    // Returns the token price
    get price(): TokenPrice {
        return this._price;
    }

    // Returns the token source info
    get sourceInfo(): TokenSourceInfo {
        return {
            symbol: this.symbol,
            name: this.name,
            logo: this.logo,
            logoURI: this.logoURI,
            contract: this.contract,
            address: this.address,
            chainId: this.chainId,
            network: this.network,
            decimals: this.decimals,
            precision: this.precision,
            isSystem: this.isSystem,
            isNative: this.isNative,
            amount: 0,
            balance: '0',
            fullBalance: '0',
        };
    }

    toString(): string {
        return this.symbol;
    }
}

// A class to represent the balance of a token
export class TokenBalance {
    readonly token: TokenClass;
    private _balanceStr: string;
    private _balanceBn: ethers.BigNumber;

    constructor(token: TokenClass, balanceBn: ethers.BigNumber) {
        this.token = token;
        this._balanceBn = balanceBn;
        this._balanceStr = `${ethers.utils.formatUnits(balanceBn, this.token.decimals)} ${this.token.symbol}`;
    }

    set balance(balanceBn: ethers.BigNumber) {
        this._balanceBn = balanceBn;
        this._balanceStr = `${ethers.utils.formatUnits(balanceBn, this.token.decimals)} ${this.token.symbol}`;
    }

    get balance(): ethers.BigNumber {
        return this._balanceBn;
    }

    // amount is an alias for balance
    get amount(): ethers.BigNumber {
        return this.balance;
    }

    // value is an alias for balance
    get value(): ethers.BigNumber {
        return this.balance;
    }

    get str(): string {
        return this._balanceStr.split(' ')[0];
    }

    // Returns the fiat balance based on the current token price and balance
    get fiatBalance(): ethers.BigNumber {
        const price = this.token.price.value;
        const fiatDouble = this.balance.mul(price);
        const fiat = fiatDouble.div(ethers.utils.parseUnits('1', this.decimals));
        return fiat;
    }

    get fiatStr(): string {
        const fiat = this.fiatBalance;
        return `${formatWei(fiat, TOKEN_PRICE_DECIMALS, 2)}`;
    }

    get id(): string {
        return this.token.id;
    }
    get symbol(): string {
        return this.token.symbol;
    }
    get name(): string {
        return this.token.name;
    }
    get logo(): string | undefined {
        return this.token.logo;
    }
    get contract(): string {
        return this.token.contract;
    }
    get chainId(): string {
        return this.token.chainId;
    }
    get decimals(): number {
        return this.token.decimals;
    }
    get isSystem(): boolean {
        return this.token.isSystem;
    }
    get isNative(): boolean {
        return this.token.isNative;
    }

    toString(): string {
        return this._balanceStr;
    }
}
