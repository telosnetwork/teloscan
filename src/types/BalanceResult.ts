export interface BalanceResult {
    balance: string;
    contract: string;
}

export interface BalanceQueryResponse {
    data: {
        results: BalanceResult[];
    }
}
