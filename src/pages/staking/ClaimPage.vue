<template>
<div>
    <div class="deposits-container">
        <div>
            <q-table
                class="deposits-table"
                :data="deposits"
                :columns="columns"
                :loading="loading"
                :hide-pagination="true"
                :rows-per-page-options="[0]"
                flat
            >
                <q-tr
                    slot="header"
                    slot-scope="props"
                    :props="props"
                    :no-hover="false"
                >
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        :auto-width="true"
                    >
                        <template
                            v-if="col.name==='time'"
                        >
                            {{ col.label }}
                            <q-icon
                                name="fas fa-info-circle"
                                @click="showAge=!showAge"
                            >
                                <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                                    click to change time format
                                </q-tooltip>
                            </q-icon>
                        </template>
                        <template v-else style="text-align:center">
                            {{ col.label }}
                        </template>
                    </q-th>
                </q-tr>
                <q-tr
                    slot="body"
                    slot-scope="props"
                    :props="props"
                >
                    <q-td key="amount" align="left" class="left-column">
                        {{ formatAmount(props.row.amount) }}
                    </q-td>
                    <q-td key="until" align="right">
                        <date-field :epoch="(props.row.until).toNumber()" :show-age="showAge" />
                    </q-td>
                </q-tr>
            </q-table>
        </div>
        <div class="col-xs-12 col-sm-4 u-flex--center claim-button-container">
            <q-btn
                :disabled="claimDisabled"
                color="secondary"
                text-color="black"
                @click="claimUnlocked"
            >
                Claim TLOS
            </q-btn>
        </div>
    </div>
    <div v-if="resultHash" class="transaction-notification col-sm-12 col-md-6 offset-md-3">
        Claim successful! View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ethers } from 'ethers';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';

export default {
    name: 'UnstakeForm',
    components: {
        DateField,
        TransactionField,
    },
    props: {
        escrowContractInstance: {
            type: Object,
            required: true,
        },
        unlockedTlosBalance: {
            type: String,
            default: null,
        },
        deposits: {
            type: Array,
            default: ()=>{ return [] },
        },
    },
    data: () => ({
        resultHash: null,
        columns: [
            {
                name: 'amount',
                label: 'Amount',
                field: 'amount',
                sortable: true,
            },
            {
                name: 'time',
                label: 'Available to Claim',
                field: 'until',
                sortable: true,
            },
        ],
        loading: false,
        showAge: true,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
        claimDisabled(){
            return this.unlockedTlosBalance == 0;
        },
    },
    methods: {
        formatAmount(val){
            return ethers.utils.formatEther(val.toString());
        },
        claimUnlocked() {
            this.escrowContractInstance.withdraw()
                .then((result) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                })
                .catch(({ message }) => {
                    console.error(`Failed to claim unlocked TLOS: ${message}`);
                    this.resultHash = null;
                });
        },
    },
}
</script>

<style lang="sass">
.deposits-container
    margin: auto

.claim-button-container
    margin-top: 1rem

.transaction-notification
    width: fit-content
    margin-top: 1rem
    margin-left: auto
    margin-right: auto

.deposits-table
    max-height: 50rem
    max-width: 20rem
    margin: auto

    .q-table__top,
    .q-table__bottom,
    thead tr:first-child th
        background-color: #404040
        position: sticky
        top:0
        z-index: 1

    thead tr th:first-child
        text-align: left

    td.left-column
        padding-left: 1rem
</style>
