/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MetaData {
    image?: any;
    animation_url?: any;
    animation?: any;
    animationExtension?: any;
    properties?: any;
}

export interface NFT {
    metadata: MetaData;
    tokenUri: string | null;
}
