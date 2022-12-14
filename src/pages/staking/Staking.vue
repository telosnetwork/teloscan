<template>
<div class="c-staking-page pageContainer">
    <div class="row q-mx-md">
        <div class="c-staking-page__header col-xs-12 col-md-6">
            <h1 class="c-staking-page__title">
                Telos EVM Staking
            </h1>
            <span class="text-white">
                Stake TLOS for sTLOS to earn interest from the staking rewards pool
            </span>
        </div>
        <div class="col-xs-12 col-md-6">
            <staking-stats
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
            <q-tabs
                v-model="selectedTab"
                dense
                active-color="secondary"
                align="justify"
                narrow-indicator
                class="c-staking-page__tabs-header tabsBar topRounded tableWrapper"
            >
                <q-route-tab
                    name="stake"
                    :to="{ hash: '#stake'}"
                    exact
                    push
                    label="Stake"
                />
                <q-route-tab
                    name="unstake"
                    :to="{ hash: '#unstake'}"
                    exact
                    push
                    label="Unstake"
                />
                <q-route-tab
                    name="claim"
                    :to="{ hash: '#claim'}"
                    exact
                    push
                    label="Claim"
                    :alert="showClaimNotification ? 'green' : false"
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
                            <stake-form
                                :stlos-contract-instance="stlosContractInstance"
                                :tlos-balance="tlosBalance"
                                :has-unlocked-tlos="showClaimNotification"
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
                            <unstake-form
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

                <q-tab-panel name="claim">
                    <div class="row">
                        <div
                            v-if="!escrowContractInstance"
                            class="col-12 u-flex--center"
                        >
                            <q-spinner />
                        </div>
                        <div v-else class="col-12">
                            <claim-page
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
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { formatWei, WEI_PRECISION } from 'src/lib/utils';

import StakeForm from 'pages/staking/StakeForm';
import StakingStats from 'pages/staking/StakingStats';

const oneEth = ethers.utils.parseEther('1').toString();

export default {
    name: 'StakingPage',
    components: {
        ClaimPage: defineAsyncComponent(() => import('pages/staking/ClaimPage.vue')),
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
        ...mapGetters('login', ['address', 'isLoggedIn']),
        showClaimNotification() {
            return BigNumber.from(this.unlockedTlosBalance ?? '0').gt('0');
        },
    },
    watch: {
        address: {
            immediate: true,
            async handler(address, oldAddress) {
                if (address !== oldAddress) {
                    await this.fetchContractInstances();
                    await this.fetchBalances();
                }
            },
        },
    },
    async created() {
        await this.fetchContracts();
        await this.fetchContractInstances();
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

            const tlosPromise = this.$providerManager.getEthersProvider().getBalance(this.address)
                .then((balanceBn) => {
                    this.tlosBalance = balanceBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account: ${message}`);
                    this.tlosBalance = null;
                });


            const stlosPromise = this.stlosContractInstance.balanceOf(this.address)
                .then((balanceBn) => {
                    this.stlosBalance = balanceBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account STLOS balance: ${message}`);
                    this.stlosBalance = null;
                });

            const currentValuePromise = this.stlosContractInstance.maxWithdraw(this.address)
                .then((valueBn) => {
                    this.stlosValue = valueBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch account STLOS balance value: ${message}`);
                    this.stlosValue = null;
                });

            const totalUnstakedPromise = this.escrowContractInstance.balanceOf(this.address)
                .then((amountBn) => {
                    this.totalUnstakedTlosBalance = amountBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch total unstaked TLOS balance: ${message}`);
                    this.totalUnstakedTlosBalance = null;
                });

            const unlockedPromise = this.escrowContractInstance.maxWithdraw(this.address)
                .then((amountBn) => {
                    this.unlockedTlosBalance = amountBn.toString();
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch withdrawable STLOS balance: ${message}`);
                    this.unlockedTlosBalance = null;
                });

            const escrowDepositsPromise = this.escrowContractInstance.depositsOf(this.address)
                .then((deposits) => {
                    this.escrowDeposits = deposits;
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch escrow deposits: ${message}`);
                });

            const conversionRatePromise = this.stlosContractInstance.previewDeposit(oneEth)
                .then((stlosBn) => {
                    this.valueOfOneStlosInTlos = formatWei(stlosBn, WEI_PRECISION, 3);
                })
                .catch(({ message }) => {
                    console.error(`Failed to fetch TLOS->sTLOS conversion rate: ${message}`);
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
            const stlosPromise = this.$contractManager.getContract(process.env.STAKED_TLOS_CONTRACT_ADDRESS)
                .then((contract) => {
                    this.stlosContract = contract;
                })
                .catch(({ message }) => {
                    console.error(`Failed to get STLOS contract: ${message}`);
                    this.stlosContract = null;
                });

            const escrowPromise = this.$contractManager.getContract(process.env.TELOS_ESCROW_CONTRACT_ADDRESS)
                .then((contract) => {
                    this.escrowContract = contract;
                })
                .catch(({ message }) => {
                    console.error(`Failed to get STLOS contract: ${message}`);
                    this.escrowContract = null;
                });

            return Promise.all([stlosPromise, escrowPromise]);
        },
        async fetchContractInstances() {
            if (!this.stlosContract || !this.escrowContract) {
                await this.fetchContracts();
            }

            const provider = this.isLoggedIn ?
                this.$providerManager.getEthersProvider().getSigner() :
                this.$contractManager.getEthersProvider();

            this.stlosContractInstance  = this.stlosContract.getContractInstance(provider, true);
            this.escrowContractInstance = this.escrowContract.getContractInstance(provider, true);

            await this.fetchBalances();

            try {
                this.unstakePeriodSeconds = (await this.escrowContractInstance.lockDuration()).toNumber();
            } catch({ message }) {
                console.error(`Failed to retrieve unstaking period: ${message}`)
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
                    this.tlosBalance = null;
                });
        },
    },
}
</script>

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
