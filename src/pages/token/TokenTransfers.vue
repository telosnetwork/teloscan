<template>
<div class="c-token-transfers container">
    <div class="row">
        <div class="col-12">
            <q-table
                v-model:pagination="pagination"
                :rows="transfers"
                :columns="columns"
                :loading="loading"
                flat
            >
                <template v-slot:header>
                    <q-tr>
                        <q-th
                            v-for="col in columns"
                            :key="col.label"
                            class="text-left"
                        >
                            {{ col.label }}

                            <q-icon
                                v-if="col.name === 'timestamp'"
                                name="fas fa-info-circle"
                                @click="showAge = !showAge"
                            >
                                <q-tooltip>Click to change format</q-tooltip>
                            </q-icon>
                        </q-th>
                    </q-tr>
                </template>

                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="transaction" :props="props">
                            <transaction-field :transaction-hash="props.row.transaction" />
                        </q-td>
                        <q-td key="block" :props="props">
                            <block-field :block="props.row.block" />
                        </q-td>
                        <q-td key="timestamp" :props="props">
                            <date-field :epoch="+props.row.timestamp" :show-age="showAge" />
                        </q-td>
                        <q-td key="from" :props="props">
                            <address-field
                                :address="props.row.from.address"
                                :is-contract="props.row.from.isContract"
                            />
                        </q-td>
                        <q-td key="to" :props="props">
                            <address-field
                                :address="props.row.to.address"
                                :is-contract="props.row.to.isContract"
                            />
                        </q-td>
                        <q-td key="amount" :props="props">
                            {{ props.row.amount }}
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
    </div>
</div>
</template>

<script>
import { keys } from 'lodash';

import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';

import { formatWei } from 'src/lib/utils';

const columns = [
    {
        name: 'transaction',
        label: 'Tx Hash',
    },
    {
        name: 'block',
        label: 'Block',
    },
    {
        name: 'timestamp',
        label: 'Date',
    },
    {
        name: 'from',
        label: 'From',
    },
    {
        name: 'to',
        label: 'To',
    },
    {
        name: 'amount',
        label: 'Quantity',
    },

].map(col => ({ ...col, align: 'left' }));

export default {
    name: 'TokenTransfers',
    emits: ['token-info-loaded'],
    components: {
        AddressField,
        BlockField,
        DateField,
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
        showAge: true,
    }),
    created() {
        const emitTokenInfo = info => this.$emit('token-info-loaded', info)

        const params = {
            limit: 1000,
            offset: null,
        };

        this.$teloscanApi.get(`token/${this.address}/transfers`, { params })
            .then(({ data }) => {
                const rows = data?.results ?? [];
                const tokenContractMeta = data?.contracts[this.address] ?? {};
                const contractAddresses = keys(data?.contracts);

                function shapeRowData(row) {
                    const { transaction, amount, block, timestamp } = row;

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
                        block,
                        timestamp,
                        amount: formatWei(amount, tokenContractMeta.decimals, 6),
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
