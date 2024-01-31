export interface ABIv1 {
  abi: {
    actions: ActionV1[];
    structs: StructV1[];
    tables: TableV1[];
  } | null;
  account_name: string;
}

interface ActionV1 {
  name: string;
  ricardian_contract: string;
  type: string;
}

interface TableV1 {
  index_type: string;
  key_names: unknown[];
  key_types: unknown[];
  name: string;
  type: string;
}

interface StructV1 {
  base: string;
  fields: FieldV1[];
  name: string;
}

interface FieldV1 {
  name: string;
  type: string;
}
