<template>
<div class="container">
    <div class="row">
        <div class="col-12">
            <q-table
                :pagination.sync="pagination"
                :data="holders"
                :columns="columns"
                :loading="loading"
                flat
                @request="onRequest"
            >
                <q-tr slot="header">
                    <q-th v-for="col in columns" :key="col.label">
                        {{ col.label }}
                    </q-th>
                </q-tr>

                <q-tr
                    slot="body"
                    slot-scope="props"
                    :props="props"
                >
                    <q-td key="rank">
                        {{ props.row.rank }}
                    </q-td>
                    <q-td key="address">
                        <router-link :to="`/address/${props.row.address}`">
                            <address-field :address="props.row.address" />
                        </router-link>
                    </q-td>
                    <q-td key="quantity">
                        {{ props.row.quantity }}
                    </q-td>
                    <q-td key="percentage">
                        {{ props.row.percentage }}
                    </q-td>
                    <q-td key="value">
                        {{ props.row.value }}
                    </q-td>
                </q-tr>
            </q-table>
        </div>
    </div>
</div>
</template>

<script>
import AddressField from 'components/AddressField';
import axios from 'axios';

const columns = [
    {
        name: 'rank',
        label: 'Rank',
        align: 'left',
    },
    {
        name: 'address',
        label: 'Address',
        align: 'left',
    },
    {
        name: 'quantity',
        label: 'Quantity',
        align: 'left',
    },
    {
        name: 'percentage',
        label: 'Percentage',
        align: 'left',
    },
    {
        name: 'value',
        label: 'Value',
        align: 'left',
    },
];

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
        pagination: {},
        holders: [],
        loading: true,
    }),
    created() {
        this.holders = [{
            rank: 1,
            address: '0xfc30552fd46ad3059ba73b982c62b4869abfb003',
            quantity: 15.5,
            percentage: 95.5,
            value: '9 USD',
        }, {
            rank: 2,
            address: '987654321',
            quantity: 1,
            percentage: 0.5,
            value: '1 USD',
        }];

        axios.get(`${process.env.TELOSCAN_API_ENDPOINT}/holders/${this.address}`)
            .then(response => {
                // debugger;
                this.holders = response;
            })
            .finally(() => {
                // debugger;
                this.loading = false
            });
    },
    methods: {
        onRequest() {
            return;
        },
    },
}
</script>

<style lang="scss">
</style>
