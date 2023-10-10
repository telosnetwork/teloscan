<!-- eslint-disable max-len -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable no-unused-vars -->
<script lang="ts">
import { defineComponent } from 'vue';
import DateField from 'components/DateField.vue';
import TransactionField from 'components/TransactionField.vue';
import { BigNumber } from 'ethers';

import {
    formatWei,
    LOGIN_DATA_KEY,
    PROVIDER_TELOS_CLOUD,
    WEI_PRECISION,
} from 'src/lib/utils';
import { mapGetters } from 'vuex';
import { CURRENT_CONTEXT, useAccountStore } from 'src/antelope/mocks';
import { escrowAbiWithdraw, EvmABI } from 'src/antelope/wallets/types';

export default defineComponent({
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
        ctaIsLoading: false,
        resultHash: null as null | string,
        columns: [
            {
                name: 'amount',
                label: '',
                field: 'amount',
                sortable: true,
            },
            {
                name: 'time',
                label: '',
                field: 'until',
                sortable: true,
            },
        ],
        showAge: true,
    }),
    created() {
        this.columns[0].label = this.$t('pages.staking.amount');
        this.columns[1].label = this.$t('pages.staking.available_to_withdraw');
    },
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
        abi(): EvmABI {
            return escrowAbiWithdraw;
        },
    },
    methods: {

        withdrawUnlocked() {
            let waitTheTransaction: Promise<{hash: string | null}> = Promise.resolve({ hash: null });
            this.ctaIsLoading = true;
            try {
                const loginData = localStorage.getItem(LOGIN_DATA_KEY);
                if (loginData) {
                    const loginObj = JSON.parse(loginData);
                    switch(loginObj?.provider) {
                    case PROVIDER_TELOS_CLOUD:
                        waitTheTransaction = this.continueWithdraw();
                        break;
                    default:
                        waitTheTransaction = this.continueWithdrawLegacy();
                    }
                }

                waitTheTransaction.then((result: { hash: null | string; }) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                }).catch(({ message }: Error) => {
                    console.error(`Failed to withdraw unlocked TLOS: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('pages.staking.withdraw_failed', { message }),
                    });
                    this.resultHash = null;
                }).finally(() => {
                    this.ctaIsLoading = false;
                });

            } catch (e) {
                console.error('Failed to unstake sTLOS', e);
            } finally {
                this.ctaIsLoading = false;
            }
        },
        continueWithdraw() {
            const logged = useAccountStore().getAccount(CURRENT_CONTEXT);
            const authenticator = logged.authenticator;

            return authenticator.signCustomTransaction(
                this.escrowContractInstance.address,
                this.abi,
                [],
            );
        },
        continueWithdrawLegacy() {
            return this.escrowContractInstance.withdraw() as Promise<{ hash: null | string; }>;
        },
        formatAmount(val: string | BigNumber | null) {
            if (val === null) {
                return '0.0';
            }

            return formatWei(val, WEI_PRECISION, 2);
        },
    },
});
</script>

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
                <template v-slot:header="props">
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
                </template>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="amount" align="left" class="left-column">
                            {{ formatAmount(props.row.amount) }}
                        </q-td>
                        <q-td key="until" align="right">
                            <DateField :epoch="(props.row.until).toNumber()" />
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
        <TransactionField :transaction-hash="resultHash" />
    </div>
</div>
</template>

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
