<template>
<div class="c-token-transfers container">
    <div class="row">
        <div class="col-12">
            <q-table
                :pagination.sync="pagination"
                :data="transfers"
                :columns="columns"
                :loading="loading"
                flat
            >
                <q-tr slot="header">
                    <q-th
                        v-for="col in columns"
                        :key="col.label"
                        class="text-left"
                    >
                        {{ col.label }}
                    </q-th>
                </q-tr>

                <q-tr
                    slot="body"
                    slot-scope="props"
                    :props="props"
                >
                    <q-td key="transaction">
                        <transaction-field :transaction-hash="props.row.transaction" />
                    </q-td>
                    <q-td key="from">
                        <address-field
                            :address="props.row.from.address"
                            :is-contract="props.row.from.isContract"
                            :truncate="40"
                        />
                    </q-td>
                    <q-td key="to">
                        <address-field
                            :address="props.row.to.address"
                            :is-contract="props.row.to.isContract"
                            :truncate="40"
                        />
                    </q-td>
                    <q-td key="amount">
                        {{ props.row.amount }}
                    </q-td>
                </q-tr>
            </q-table>
        </div>
    </div>
</div>
</template>

<script>
import { keys } from 'lodash';

import AddressField from 'components/AddressField';
import TransactionField from 'components/TransactionField';

import { formatBN } from 'src/lib/utils';

const columns = [
    {
        name: 'transaction',
        label: 'Tx Hash',
        align: 'left',
    },
    {
        name: 'from',
        label: 'From',
        align: 'left',
    },
    {
        name: 'to',
        label: 'To',
        align: 'left',
    },
    {
        name: 'amount',
        label: 'Quantity',
        align: 'left',
    },

];

export default {
    name: 'TokenTransfers',
    components: {
        AddressField,
        TransactionField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data: () => ({
        columns,
        pagination: {
            page: 1,
            rowsPerPage: 50,
        },
        transfers: [],
        loading: true,
    }),
    created() {
        const emitTokenInfo = info => this.$emit('token-info-loaded', info)

        const params = {
            address: null,
            contract: this.address,
            limit: 1000,
            offset: null,
        };

        this.$teloscanApi.get('transfers', { params })
            .then(({ data }) => {
                const rows = data?.results ?? [];
                const tokenContractMeta = data?.contracts[this.address] ?? {};
                const contractAddresses = keys(data?.contracts);

                function shapeRowData(row) {
                    const { transaction, amount } = row;

                    const shapedToAndFrom = ['to', 'from'].reduce(
                        (accumulator, property) => ({
                            ...accumulator,
                            [property]: {
                                address: row[property],
                                isContract: contractAddresses.includes(row[property]),
                            },
                        }),
                        {},
                    );

                    return {
                        transaction,
                        amount: formatBN(amount, tokenContractMeta.decimals, 6),
                        ...shapedToAndFrom,
                    };
                }

                emitTokenInfo(tokenContractMeta);
                this.transfers = rows.map(row => shapeRowData(row));
            })
            .catch((err) => {
                emitTokenInfo({});
                console.error(`Unable to fetch token transfers for address ${this.address}:\n${err}`);
            })
            .finally(() => {
                this.loading = false;
            });
    },
}
</script>

<style lang="scss">
</style>
