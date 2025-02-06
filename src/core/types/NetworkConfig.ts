import { HeaderIndicators } from 'src/core/types/PriceData';
import { HeaderMenuEntry } from './Theme';

export interface NetworkConfig {
    // The unique network identifier
    network: string;

    // A human-readable name for display purposes
    display: string;

    // the title of the site
    title: string;

    // App header branding name
    branding: {
        tab: string;
        icon: string;
        text: string;
    };

    // The chain ID associated with this network
    chainId: string;

    // Whether this network is a testnet
    isTestnet: boolean;

    // Logo paths
    logos: {
        large: string;
        small: string;
    };

    // System tokens used by this network
    systemTokens: {
        name: string;
        symbol: string;
        network: string;
        decimals: number;
        address: string;
        logo: string;
        isNative: boolean;
        isSystem: boolean;
    }[];

    // The escrow contract address
    escrowContractAddress: string;

    // Various endpoints required by the network
    apiEndpoints: {
        rpc: {
            protocol: string;
            host: string;
            port: number;
            path?: string;
        };
        api: string;
        hyperion: string;
        explorer: string;
        ecosystem: string;
        bridge: string;
        indexer?: string;
        contractsBucket: string;
        monitor?: string;
    };

    // Price data sources
    priceData: {
        coingeckoId: string;
    };

    // The default wei precision
    weiPrecision: number;

    // Themes configuration (light and dark)
    themes: {
        light: {
            primary: string;
            secondary: string;
            accent: string;
            dark: string;
            positive: string;
            negative: string;
            info: string;
            warning: string;
            'notify-success': string;
            'notify-error': string;
            'notify-neutral': string;
            'notify-info': string;
            'title-image': string;
        };
        dark: {
            primary: string;
            secondary: string;
            accent: string;
            dark: string;
            positive: string;
            negative: string;
            info: string;
            warning: string;
            'notify-success': string;
            'notify-error': string;
            'notify-neutral': string;
            'notify-info': string;
            'title-image': string;
        };
    };

    // Social links configuration
    socialLinks: {
        name: string;
        url: string;
        icon: string;
        classSuffix: string;
    }[];

    // Footer links configuration
    footerLinks: {
        chain: string;
        branding: {
            title: string;
            logoLight: string;
            logoDark: string;
            url: string;
        };
        columns: {
            title: string;
            links: {
                label: string;
                url: string;
            }[];
        }[];
    };

    // Header data indicators
    headerIndicators: HeaderIndicators;

    // Header menu configuration
    headerMenuConfig: {
        chain: string;
        entries: HeaderMenuEntry[];
    };

    // Link to buy more tokens
    buyMoreTokenLink: string;

    // Native UAL chain configuration
    nativeUalChain: {
        chainId: string;
        rpcEndpoints: {
            protocol: string;
            host: string;
            port: number;
        }[];
    };

    // url of the token tokenlist
    tokenListUrl: string;

    // url of the system tokenlist
    systemContractsListUrl: string;

}


