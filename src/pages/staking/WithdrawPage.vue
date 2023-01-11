<template>
<div>
    <div class="deposits-container">
        <div>
            <q-table
                class="deposits-table"
                :rows="deposits"
                :columns="columns"
                :loading="isLoading"
                :hide-pagination="true"
                :pagination="{
                    rowsPerPage: deposits.length,
                    rowsNumber: deposits.length
                }"
                :no-data-label="$t('pages.staking.no_withdrawable_positions')"
                flat
            >
                <q-tr :props="props" :no-hover="false">
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        :auto-width="true"
                    >
                        <template v-if="col.name==='time'">
                            {{ col.label }}
                            <q-icon
                                name="fas fa-info-circle"
                                class="info-icon"
                                @click="showAge=!showAge"
                            >
                                <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                                    {{ $t('pages.staking.click_to_change_time_format') }}
                                </q-tooltip>
                            </q-icon>
                        </template>
                        <template v-else>
                            {{ col.label }}
                        </template>
                    </q-th>
                </q-tr>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="amount" align="left" class="left-column">
                            {{ formatAmount(props.row.amount) }}
                        </q-td>
                        <q-td key="until" align="right">
                            <date-field :epoch="(props.row.until).toNumber()" :show-age="showAge" />
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
        <div v-show="isLoggedIn" class="escrow-stat-container">
            <div class="escrow-stat">
                {{ $t('pages.staking.unstaking') }}: {{ unstakingBalance }}
            </div>
            <div class="escrow-stat">
                {{ $t('pages.staking.available_to_withdraw') }}: {{ unlockedBalance }}
            </div>
        </div>
        <div class="col-xs-12 u-flex--center withdraw-button-container">
            <q-btn
                :disabled="withdrawDisabled"
                color="secondary"
                text-color="black"
                @click="withdrawUnlocked"
            >
                {{ $t('pages.staking.withdraw_tlos') }}
            </q-btn>
        </div>
    </div>
    <div v-if="resultHash" class="transaction-notification col-sm-12 col-md-6 offset-md-3">
        {{ $t('pages.staking.withdraw_successful') }}:
        <transaction-field :transaction-hash="resultHash" />
    </div>
</div>
</template>

<script>
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import { BigNumber } from 'ethers';

import { formatWei, WEI_PRECISION } from 'src/lib/utils';
import { mapGetters } from 'vuex';

export default {
    name: 'WithdrawPage',
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
        totalUnstaked: {
            type: String,
            default: null,
        },
        deposits: {
            type: Array,
            required: true,
        },
    },
    emits: ['balance-changed'],
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
                label: 'Available to Withdraw',
                field: 'until',
                sortable: true,
            },
        ],
        showAge: true,
    }),
    computed: {
        ...mapGetters('login', ['isLoggedIn', 'isNative']),
        withdrawDisabled(){
            return this.unlockedTlosBalance === '0' || this.isLoading || !this.isLoggedIn || this.isNative;
        },
        isLoading(){
            return this.isLoggedIn && !this.isNative && this.unlockedTlosBalance === null;
        },
        unstakingBalance(){
            const total = BigNumber.from(this.totalUnstaked ?? '0').sub(this.unlockedTlosBalance ?? '0');
            return this.formatAmount(total);
        },
        unlockedBalance(){
            return this.formatAmount(this.unlockedTlosBalance);
        },
    },
    methods: {
        withdrawUnlocked() {
            return this.escrowContractInstance.withdraw()
                .then((result) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                })
                .catch(({ message }) => {
                    console.error(`Failed to withdraw unlocked TLOS: ${message}`);
                    this.resultHash = null;
                });
        },
        formatAmount(val) {
            if (val === null)
                return '0.0'

            return formatWei(val, WEI_PRECISION, 2);
        },
    },
}
</script>

<style lang="sass" scoped>
.deposits-container
    margin: auto

.withdraw-button-container
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
        position: sticky
        top: 0
        z-index: 1

    thead tr th:first-child
        text-align: left

    td.left-column
        padding-left: 1rem

    &.q-table--dark
        .q-table__top,
        .q-table__bottom,
        thead tr:first-child th
            background-color: #404040

.escrow-stat-container
    width: fit-content
    height: 1rem
    margin: auto
.escrow-stat
    float: left
    margin: .25rem

</style>
