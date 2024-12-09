export interface CoreErrorPayload {
    [key:string]: unknown
}

export class CoreError extends Error {
    public payload?: CoreErrorPayload;
    constructor(
        message: string | undefined,
        public _payload?: unknown,
    ) {
        super(message);
        if (_payload) {
            this.payload = _payload as { [key:string]: unknown};
        }
    }
}

