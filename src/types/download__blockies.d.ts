declare module '@download/blockies' {
    interface BlockiesOptions {
        seed: string;
        color?: string;
        bgcolor?: string;
        size?: number;
        scale?: number;
    }

    interface Blockies {
        toDataURL: () => string;
    }

    export function createIcon(options: BlockiesOptions): Blockies;
}
