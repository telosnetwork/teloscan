/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import {
    Checksum160,
    Checksum256,
    Float64,
    Name,
    NameType,
    UInt128,
    UInt64,
    UInt32Type,
    API,
    PublicKey,
    Float128,
} from '@greymass/eosio';

import {
    AccountDetails,
    Action,
    PermissionLinks,
    TableByScope,
    TransactionV1,
    Block,
    ActionData,
    Get_actions,
    HyperionActionsFilter,
    TokenSourceInfo,
} from 'src/antelope/types';

export const NativeCurrencyAddress = '___NATIVE_CURRENCY___';

export type AccountCreatorInfo = {
  creator: string;
  timestamp: string;
  trx_id: string;
}

export type TableIndexType =
    | Name
    | UInt64
    | UInt128
    | Float64
    | Checksum256
    | Checksum160;

export interface TableIndexTypes {
    float128: Float128;
    float64: Float64;
    i128: UInt128;
    i64: UInt64;
    name: Name;
    ripemd160: Checksum160;
    sha256: Checksum256;
}
export interface GetTableRowsParamsKeyed<Index = TableIndexType, Key = keyof TableIndexTypes> extends GetTableRowsParams<Index> {
  // Index key type, determined automatically when passing a typed `upper_bound` or `lower_bound`.
  key_type: Key;
}

export interface GetTableRowsParamsTyped<Index = TableIndexType | string, Row = string> extends GetTableRowsParams<Index> {
  // Result type for each row.
  type: Row;
}

export interface GetTableRowsParams<Index = TableIndexType | string> {
  // The name of the smart contract that controls the provided table.
  code: NameType;
  // Name of the table to query.
  table: NameType;
  // The account to which this data belongs, if omitted will be set to be same as `code`.
  scope?: string | TableIndexType;
  // Lower lookup bound.
  lower_bound?: Index;
  // Upper lookup bound.
  upper_bound?: Index;
  // How many rows to fetch, defaults to 10 if unset.
  limit?: UInt32Type;
  // Whether to iterate records in reverse order.
  reverse?: boolean;
  // Position of the index used, defaults to primary.
  index_position?: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth';
  // Whether node should try to decode row data using code abi.
  // Determined automatically based the `type` param if omitted.
  json?: boolean;
  // Set to true to populate the ram_payers array in the response.
  show_payer?: boolean;
}



export interface GetTableRowsResponse<Index = TableIndexType, Row = unknown> {
    rows: Row[];
    more: boolean;
    ram_payers?: Name[];
    next_key?: Index;
}

export type ApiClient = {
    getAccount: (address: string) => Promise<API.v1.AccountObject>;
    getKeyAccounts: (key: PublicKey) => Promise<{ account_names: Name[] }>;
    getHyperionAccountData: (address: string) => Promise<AccountDetails>;
    getCreator: (address: string) => Promise<unknown>;
    getTokens: (address: string) => Promise<TokenSourceInfo[]>;
    getTransactions: (filter: HyperionActionsFilter) => Promise<Action[]>;
    getTransaction: (address: string) => Promise<ActionData>;
    getTransactionV1: (id: string) => Promise<TransactionV1>;
    getChildren: (address: string) => Promise<Action[]>;
    getPermissionLinks: (address: string) => Promise<PermissionLinks[]>;
    getTableByScope: (data: unknown) => Promise<TableByScope[]>;
    getBlock: (block: string) => Promise<Block>;
    getActions: (address: string, filter: string) => Promise<Get_actions>;
    getApy: () => Promise<string>;
};
