<script>
import { defineAsyncComponent } from 'vue';
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import {
    formatWei,
    getRouteWatcherForTabs,
    LOGIN_DATA_KEY,
    PROVIDER_WEB3_INJECTED,
    WEI_PRECISION,
} from 'src/lib/utils';

import StakeForm from 'pages/staking/StakeForm';
import StakingStats from 'pages/staking/StakingStats';

const oneEth = ethers.utils.parseEther('1').toString();

const tabs = {
    stake: '#stake',
    unstake: '#unstake',
    withdraw: '#withdraw',
};

export default {
    name: 'StakingPage',
    components: {
        WithdrawPage: defineAsyncComponent(() => import('pages/staking/WithdrawPage.vue')),
        StakeForm,
        StakingStats,
        UnstakeForm: defineAsyncComponent(() => import('pages/staking/UnstakeForm')),
    },
    data: () => ({
        selectedTab: '#stake',
        stlosContract: null,
        escrowContract: null,
        stlosContractInstance: null,
        escrowContractInstance: null,
        valueOfOneStlosInTlos: null,
        tlosBalance: null,
        stlosBalance: null,
        stlosValue: null,
        totalUnstakedTlosBalance: null,
        unlockedTlosBalance: null,
        unstakePeriodSeconds: null,
        escrowDeposits: [],
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn', 'isNative']),
        showWithdrawNotification() {
            return BigNumber.from(this.unlockedTlosBalance ?? '0').gt('0');
        },
    },
    watch: {
        address: {
            immediate: true,
            async handler(address, oldAddress) {
                if (address && address !== oldAddress) {
                    await this.fetchContractInstances();
                    await this.fetchBalances();
                }
            },
        },
        $route: getRouteWatcherForTabs('staking', tabs, tabs.stake),
    },
    async created() {
        await this.fetchContracts();
        await this.fetchContractInstances();
        if(!this.isLoggedIn){
            this.$q.notify({
                type: 'info',
                message: this.$t('pages.staking.sign_in'),
            });
        }
    },
    methods: {
        async fetchBalances() {
            if (!this.address) {
                this.tlosBalance = null;
                this.stlosBalance = null;
                this.unlockedTlosBalance = null;
                this.totalUnstakedTlosBalance = null;
                this.stlosValue = null;
                this.escrowDeposits = [];
                this.valueOfOneStlosInTlos = null;

                return;
            }

            const tlosPromise = this.$contractManager.getEthersProvider().getBalance(this.address)
                .then((balanceBn) => {
                    this.tlosBalance = balanceBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('pages.staking.fetch_balance_error', { message }),
                    });
                    this.tlosBalance = null;
                });


            const stlosPromise = this.stlosContractInstance.balanceOf(this.address)
                .then((balanceBn) => {
                    this.stlosBalance = balanceBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account STLOS balance: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_stlos_balance_error', { message }),
                    });

                    this.stlosBalance = null;
                });

            const currentValuePromise = this.stlosContractInstance.maxWithdraw(this.address)
                .then((valueBn) => {
                    this.stlosValue = valueBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account STLOS balance value: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_stlos_value_error', { message }),
                    });
                    this.stlosValue = null;
                });

            const totalUnstakedPromise = this.escrowContractInstance.balanceOf(this.address)
                .then((amountBn) => {
                    this.totalUnstakedTlosBalance = amountBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch total unstaked TLOS balance: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_unstaked_balance_error', { message }),
                    });

                    this.totalUnstakedTlosBalance = null;
                });

            const unlockedPromise = this.escrowContractInstance.maxWithdraw(this.address)
                .then((amountBn) => {
                    this.unlockedTlosBalance = amountBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch withdrawable STLOS balance: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_unlocked_balance_error', { message }),
                    });
                    this.unlockedTlosBalance = null;
                });

            const escrowDepositsPromise = this.escrowContractInstance.depositsOf(this.address)
                .then((deposits) => {
                    this.escrowDeposits = deposits;
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch escrow deposits: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_escrow_deposits_error', { message }),
                    });
                });

            const conversionRatePromise = this.stlosContractInstance.previewDeposit(oneEth)
                .then((stlosBn) => {
                    this.valueOfOneStlosInTlos = formatWei(stlosBn, WEI_PRECISION, 3);
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch TLOS->sTLOS conversion rate: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_conversion_rate_error', { message }),
                    });
                });

            return Promise.all([
                tlosPromise,
                stlosPromise,
                currentValuePromise,
                totalUnstakedPromise,
                unlockedPromise,
                escrowDepositsPromise,
                conversionRatePromise,
            ]);
        },
        async fetchContracts() {
            const stlosPromise = await this.$contractManager.getContract(process.env.STAKED_TLOS_CONTRACT_ADDRESS)
                .then((contract) => {
                    this.stlosContract = contract;
                })
                .catch(({ message }) => {
                    console.error(`Failed to get STLOS contract: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_stlos_contract_error', { message }),
                    });
                    this.stlosContract = null;
                });

            const escrowPromise = await this.$contractManager.getContract(process.env.TELOS_ESCROW_CONTRACT_ADDRESS)
                .then((contract) => {
                    this.escrowContract = contract;
                })
                .catch(({ message }) => {
                    console.error(`Failed to get Escrow contract: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_escrow_contract_error', { message }),
                    });
                    this.escrowContract = null;
                });

            return await Promise.all([stlosPromise, escrowPromise]);
        },
        async fetchContractInstances() {
            if (!this.stlosContract || !this.escrowContract || !this.escrowContract.abi) {
                await this.fetchContracts();
            }

            // default provider is the ContractManager ethers provider (JsonRpcProvider)
            let provider = this.$contractManager.getEthersProvider();

            if (this.isLoggedIn && !this.isNative) {
                // only if the user is logged with a non-native wallet, we may change the provider
                const loginData = localStorage.getItem(LOGIN_DATA_KEY);
                if (loginData) {
                    // If the user is authenticated using any Antelope.wallet.authenticators
                    const loginObj = JSON.parse(loginData);
                    switch(loginObj?.provider) {
                    case PROVIDER_WEB3_INJECTED:
                        provider = this.$providerManager.getEthersProvider().getSigner();
                        break;
                    }
                } else {
                    // legacy fallback
                    provider = this.$providerManager.getEthersProvider().getSigner();
                }
            }

            this.stlosContractInstance  = this.$contractManager.getContractInstance(this.stlosContract, provider);
            this.escrowContractInstance = this.$contractManager.getContractInstance(this.escrowContract, provider);

            await this.fetchBalances();

            try {
                this.unstakePeriodSeconds = (await this.escrowContractInstance.lockDuration()).toNumber();
            } catch({ message }) {
                console.error(`Failed to retrieve unstaking period: ${message}`);
                this.$q.notify({
                    type: 'negative',
                    message: this.$t('page.staking.fetch_unstake_period_error', { message }),
                });
            }
        },
        async handleBalanceChanged() {
            // note this method of attaining account balance is different from that in fetchBalances(), which
            // seems to update slowly, yet is able (unlike this method) to handle new accounts with 0 balance
            await this.fetchBalances();
            this.$evm.telos.getEthAccount(this.address)
                .then((account) => {
                    this.tlosBalance = account.balance.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('page.staking.fetch_account_error', { message }),
                    });
                    this.tlosBalance = null;
                });
        },
    },
};
</script>

<template>
<div class="c-staking-page pageContainer">
    <div class="row flex q-mx-md">
        <div class="c-staking-page__header col-xs-12 col-md-5">
            <h1 class="c-staking-page__title">
                {{ $t('pages.staking.telos_evm_staking') }}
            </h1>
            <span class="text-white">
                {{ $t('pages.staking.stake_tlos_earn_interest') }}
            </span>
        </div>
        <div class="col-xs-12 col-md-1">
        </div>
        <div class="col-xs-12 col-md-6">
            <StakingStats
                v-if="stlosContractInstance"
                :stlos-contract-instance="stlosContractInstance"
                :stlos-balance="stlosBalance"
                :stlos-value="stlosValue"
                :total-unstaked-tlos-balance="totalUnstakedTlosBalance"
                :unstake-period-seconds="unstakePeriodSeconds"
            />
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <div>
                <q-tabs
                    v-model="selectedTab"
                    dense
                    active-color="secondary"
                    align="justify"
                    narrow-indicator
                    class="c-staking-page__tabs-header tabsBar topRounded"
                >
                    <q-route-tab
                        name="stake"
                        :to="{ hash: '#stake'}"
                        exact
                        push
                        :label="$t('pages.staking.stake')"
                    />
                    <q-route-tab
                        name="unstake"
                        :to="{ hash: '#unstake'}"
                        exact
                        push
                        :label="$t('pages.staking.unstake')"
                    />
                    <q-route-tab
                        name="withdraw"
                        :to="{ hash: '#withdraw'}"
                        exact
                        push
                        :label="$t('pages.staking.withdraw')"
                        :alert="showWithdrawNotification ? 'green' : false"
                    />
                </q-tabs>
                <q-tab-panels
                    v-model="selectedTab"
                    animated
                    keep-alive
                    class="q-py-lg"
                >
                    <q-tab-panel name="stake">
                        <div class="row">
                            <div v-if="!stlosContractInstance" class="col-12 u-flex--center">
                                <q-spinner />
                            </div>
                            <div v-else class="col-12">
                                <StakeForm
                                    :stlos-contract-instance="stlosContractInstance"
                                    :tlos-balance="tlosBalance"
                                    :has-unlocked-tlos="showWithdrawNotification"
                                    :unstake-period-seconds="unstakePeriodSeconds"
                                    :value-of-one-stlos-in-tlos="valueOfOneStlosInTlos"
                                    @balance-changed="handleBalanceChanged"
                                />
                            </div>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="unstake">
                        <div class="row">
                            <div
                                v-if="!stlosContractInstance || !escrowContractInstance"
                                class="col-12 u-flex--center"
                            >
                                <q-spinner />
                            </div>
                            <div v-else class="col-12">
                                <UnstakeForm
                                    :stlos-contract-instance="stlosContractInstance"
                                    :escrow-contract-instance="escrowContractInstance"
                                    :stlos-balance="stlosBalance"
                                    :unlocked-tlos-balance="unlockedTlosBalance"
                                    :unstake-period-seconds="unstakePeriodSeconds"
                                    :deposits="escrowDeposits"
                                    :value-of-one-stlos-in-tlos="valueOfOneStlosInTlos"
                                    @balance-changed="handleBalanceChanged"
                                />
                            </div>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="withdraw">
                        <div class="row">
                            <div
                                v-if="!escrowContractInstance"
                                class="col-12 u-flex--center"
                            >
                                <q-spinner />
                            </div>
                            <div v-else class="col-12">
                                <WithdrawPage
                                    :escrow-contract-instance="escrowContractInstance"
                                    :unlocked-tlos-balance="unlockedTlosBalance"
                                    :total-unstaked="totalUnstakedTlosBalance"
                                    :deposits="escrowDeposits"
                                    @balance-changed="handleBalanceChanged"
                                />
                            </div>
                        </div>
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-staking-page {
    margin-top: 24px;

    @media screen and (min-width: $breakpoint-md-min) {
        margin-top: 48px;
    }

    &__header {
        margin-bottom: 32px;
    }

    &__title {
        color: $primary;
        margin: 0 0 12px;
        font-size: 2.125rem;
        font-weight: 400;
        line-height: 2rem;
        letter-spacing: 0.00735em;
    }

    &__tabs-header {
        background: $dark;
        color: white;
        max-width: 100vw;

        @at-root .body--light & {
            background: white;
            color: $dark;
        }
    }

    // prevent scrolling behavior on quasar tab panels, which cannot be overridden using q-tab-panel API
    .q-panel.scroll {
        overflow: unset;
    }
}
</style>
