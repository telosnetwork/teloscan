
export interface Tag {
    name: string;
    description: string;
}

export interface Token {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    coingeckoId: string | boolean;
    cmcId: number | boolean;
    logoURI: string;
    decimals: number;
    tags: string[];
    issuer: string;
    issuer_link: string;
}

export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export interface TokenList {
    name: string;
    logoURI: string;
    keywords: string[];
    tags: { [key: string]: Tag };
    timestamp: string;
    tokens: Token[];
    version: Version;
}
