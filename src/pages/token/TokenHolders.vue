<template>
<div class="container">
    <div class="row">
        <div class="col-12">
            <q-table
                v-model:pagination="pagination"
                :data="holders"
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
                        </q-th>
                    </q-tr>
                </template>

                <template v-slot:body="props">
                    <q-tr>
                        <q-td key="rank">
                            {{ props.row.rank }}
                        </q-td>
                        <q-td key="address">
                            <router-link :to="`/address/${props.row.holder.address}`">
                                <address-field
                                    :address="props.row.holder.address"
                                    :is-contract="props.row.holder.isContract"
                                    :truncate="-1"
                                />
                            </router-link>
                        </q-td>
                        <q-td key="balance">
                            {{ props.row.balance }}
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

import { formatWei } from 'src/lib/utils';

const columns = [{
    name: 'rank',
    label: 'Rank',
    align: 'left',
},{
    name: 'address',
    label: 'Address',
    align: 'left',
},{
    name: 'balance',
    label: 'Balance',
    align: 'left',
}];

export default {
    name: 'TokenHolders',
    components: {
        AddressField,
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
        holders: [],
        loading: true,
    }),
    created() {
        const emitTokenInfo = info => this.$emit('token-info-loaded', info)

        const params = {
            limit: 1000,
            offset: null,
        };

        this.$teloscanApi.get(`holders/${this.address}`, { params })
            .then(({ data }) => {
                const rows = data?.results ?? [];
                const tokenContractMeta = data?.contracts[this.address] ?? {};
                const contractAddresses = keys(data?.contracts);

                const shapedRows = rows.map(({ balance, address }, index) => ({
                    rank: index + 1,
                    balance: formatWei(balance, tokenContractMeta.decimals, 6),
                    holder: {
                        address,
                        isContract: contractAddresses.includes(address),
                    },
                }));

                emitTokenInfo(tokenContractMeta);
                this.holders = [...shapedRows];
            })
            .catch((err) => {
                emitTokenInfo({});
                this.holders = [];
                console.error(`Unable to fetch token holders for address ${this.address}:\n${err}`);
            })
            .finally(() => {
                this.loading = false
            });
    },
}
</script>

<style lang="scss">
</style>
