/* eslint-disable no-unused-vars */
declare module 'qrious' {

    type QRiousOptions = {
        value: string;
        size?: number;
        padding?: number;
        level?: 'L' | 'M' | 'Q' | 'H';
        foreground?: string;
        background?: string;
        foregroundAlpha?: number;
        backgroundAlpha?: number;
        mime?: string;
        element?: HTMLElement | null;
    }

    class QRious {
        constructor(options?: QRiousOptions);
        value: string;
        size: number;
        padding: number;
        level: 'L' | 'M' | 'Q' | 'H';
        foreground: string;
        background: string;
        foregroundAlpha: number;
        backgroundAlpha: number;
        mime: string;
        element: HTMLElement | null;
        image: HTMLImageElement | null;
        set(options: QRiousOptions): void;
        toDataURL(mime?: string): string;
    }

    export default QRious;
}
