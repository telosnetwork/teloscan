export interface AntelopeErrorPayload {
    [key:string]: unknown
}

export class AntelopeError extends Error {
    public payload?: AntelopeErrorPayload;
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

