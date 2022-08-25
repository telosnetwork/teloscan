<template>
<div class="c-staking-page pageContainer q-pt-xl">
    <div class="row q-mx-md q-mb-lg">
        <div class="col-xs-12 col-md-6">
            <h1 class="c-staking-page__title">
                Telos EVM Staking
            </h1>
            <p class="text-white">
                Stake sTLOS and receive sTLOS from the shared REX/EVM pool
            </p>
            <p
                v-if="showAddToMetaMask"
                class="c-staking-page__metamask-prompt u-flex--center-y"
                tabindex="0"
                aria-role="button"
                aria-label="Launch MetaMask dialog to track sTLOS"
                @click="promptAddToMetamask"
                @keydown.space.enter="promptAddToMetamask"
            >
                Keep track of your sTLOS in MetaMask
                <img
                    :src="MetaMaskLogo"
                    class="q-ml-xs"
                    height="24"
                    width="24"
                    alt="MetaMask Fox Logo"
                >
            </p>
        </div>
        <div class="col-xs-12 col-md-6">
            <q-card class="c-staking-page__stats-container">
                <div
                    v-for="{ label, value, unit } in stats"
                    :key="label"
                    class="c-staking-page__stat"
                >
                    <div class="c-staking-page__stat-label">
                        {{ label }}
                        <span class="c-staking-page__stat-unit">{{ unit }}</span>
                    </div>

                    <div class="c-staking-page__stat-value">
                        {{ value }}
                    </div>
                </div>
            </q-card>
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
                    to="#stake"
                    exact
                    push
                    label="Stake"
                />
                <q-route-tab
                    name="unstake"
                    to="#unstake"
                    exact
                    push
                    label="Unstake"
                />
                <q-route-tab
                    name="claim"
                    to="#claim"
                    exact
                    push
                    label="Claim"
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
                        <div
                            v-if="!stlosContractInstance"
                            class="col-12 u-flex--center"
                        >
                            <q-spinner />
                        </div>
                        <div v-else class="col-12">
                            <stake-form
                                :stlos-contract-instance="stlosContractInstance"
                                :tlos-balance="tlosBalance"
                                :unstake-period-seconds="unstakePeriodSeconds"
                                @balance-changed="fetchBalances"
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
                                @balance-changed="fetchBalances"
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
                                :deposits="escrowDeposits"
                                @balance-changed="fetchBalances"
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
import { ethers, BigNumber } from 'ethers';
import Big from 'big.js';
import { mapGetters } from 'vuex';

import { promptAddToMetamask } from 'pages/staking/staking-utils';
import MetaMaskLogo from 'src/assets/metamask-fox.svg'

import StakeForm from 'pages/staking/StakeForm';
import UnstakeForm from 'pages/staking/UnstakeForm';
import ClaimPage from 'pages/staking/ClaimPage.vue';

import { formatBN, WEI_PRECISION } from 'src/lib/utils';

const tabs = {
    stake: 'stake',
    unstake: 'unstake',
    claim: 'claim',
}

export default {
    name: 'StakingPage',
    components: {
        StakeForm,
        UnstakeForm,
        ClaimPage,
    },
    data: () => ({
        tabs,
        MetaMaskLogo,
        selectedTab: tabs.stake,
        stlosContract: null,
        escrowContract: null,
        stlosContractInstance: null,
        escrowContractInstance: null,
        tlosBalance: null,
        stlosBalance: null,
        stlosValue: null,
        stlosTvl: null,
        stlosApy: null,
        totalUnstakedTlosBalance: null,
        unlockedTlosBalance: null,
        unstakePeriodSeconds: null,
        escrowDeposits: [],
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
        showAddToMetaMask() {
            return this.isLoggedIn && window.ethereum.isMetaMask === true;
        },
        lockedTlosBalance() {
            if (!this.isLoggedIn)
                return null;

            const unstakedBn = BigNumber.from(this.totalUnstakedTlosBalance ?? '0');
            const unlockedBn = BigNumber.from(this.unlockedTlosBalance ?? '0');

            return unstakedBn.sub(unlockedBn);
        },
        stats() {
            return [{
                label: 'TVL',
                value: this.formatWeiForStats(this.stlosTvl),
                unit: 'TLOS',
            },{
                label: 'APY',
                value: this.stlosApy,
                unit: '%',
            },{
                label: 'Balance',
                value: this.formatWeiForStats(this.tlosBalance),
                unit: 'TLOS',
            }, {
                label: 'Staked',
                value: this.formatWeiForStats(this.stlosBalance),
                unit: 'STLOS',
            }, {
                label: 'Value',
                value: this.formatWeiForStats(this.stlosValue),
                unit: 'TLOS',
            }, {
                label: 'Total Escrowed',
                value: this.formatWeiForStats(this.totalUnstakedTlosBalance),
                unit: 'TLOS',
            },
            ];
        },
    },
    watch: {
        ['$route.hash']: {
            immediate: true,
            handler(newHash, oldHash) {
                if (oldHash === newHash)
                    return;

                const hash = newHash?.replace('#', '') ?? '';
                const tabNames = Object.values(this.tabs);
                const shouldAddStakeHash = !tabNames.includes(hash);

                if (shouldAddStakeHash)
                    this.$router.replace({ hash: tabs.stake });
            },
        },
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
        await this.fetchGlobalStats();
    },
    methods: {
        promptAddToMetamask,
        async fetchGlobalStats() {
            this.stlosTvl = await this.stlosContractInstance.totalAssets()

            if (this.stlosTvl.eq('0')) {
                this.stlosApy = '0';
                return;
            }

            const rexPoolResponse = await this.$store.$api.getTableRows({
                code: 'eosio',
                scope: 'eosio',
                table: 'rexpool',
                limit: '1',
            });

            if (!rexPoolResponse || !rexPoolResponse.rows.length) {
                console.error('Failed to fetch rexpool');
                return;
            }

            const distConfigResponse = await this.$store.$api.getTableRows({
                code: 'exrsrv.tf',
                scope: 'exrsrv.tf',
                table: 'config',
                limit: '1',
            });

            if (!distConfigResponse || !distConfigResponse.rows.length) {
                console.error('Failed to fetch exrsrv.tf config');
                return;
            }

            const payoutsResponse = await this.$store.$api.getTableRows({
                code: 'exrsrv.tf',
                scope: 'exrsrv.tf',
                table: 'payouts',
                limit: '100',
            });

            if (!payoutsResponse || !payoutsResponse.rows.length) {
                console.error('Failed to fetch exrsrv.tf payouts');
                return;
            }


            const rexStats = rexPoolResponse.rows[0];
            const distConfig = distConfigResponse.rows[0];
            const payoutRow = payoutsResponse.rows.find((row) => row.to === 'eosio.rex');

            const annualPayout = new Big(payoutRow.amount).times(new Big(60 * 60 * 24 * 365).div(payoutRow.interval));
            const fixedRatio = new Big(distConfig.ratio).div(100);
            const rexTotal = new Big(rexStats.total_lendable.split(' ')[0]);
            const stlosTotal = new Big(ethers.utils.formatEther(this.stlosTvl));

            const balanceRatio = rexTotal.eq(0) ? -1 : stlosTotal.times(fixedRatio).div(rexTotal);

            if (balanceRatio.eq(0)) {
                this.stlosApy = '0';
                return;
            }

            const rexPayout = annualPayout.div(balanceRatio.plus(1));
            const stlosPayout = annualPayout.minus(rexPayout);
            this.stlosApy = stlosPayout.div(stlosTotal).times(100).toFixed(2);
            console.log(`Rex APY: ${rexPayout.div(rexTotal).times(100).toFixed(2)}%`)
            console.log(`sTLOS APY: ${this.stlosApy}%`)
        },
        fetchBalances() {
            if (!this.address) {
                this.tlosBalance = null;
                this.stlosBalance = null;
                this.unlockedTlosBalance = null;
                this.totalUnstakedTlosBalance = null;
                this.stlosValue = null;
                this.escrowDeposits = [];
                return;
            }

            const tlosPromise = this.$evm.telos.getEthAccount(this.address)
                .then((account) => {
                    this.tlosBalance = account.balance.toString();
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


            return Promise.all([
                tlosPromise,
                stlosPromise,
                currentValuePromise,
                totalUnstakedPromise,
                unlockedPromise,
                escrowDepositsPromise,
            ]);
        },
        fetchContracts() {
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
        formatWeiForStats(wei) {
            return !wei ? '--': formatBN(wei, WEI_PRECISION, 3);
        },
    },
}
</script>

<style scoped lang="scss">
.c-staking-page {
    &__title {
        color: $primary;
        margin: 0 0 12px;
        font-size: 2.125rem;
        font-weight: 400;
        line-height: 2rem;
        letter-spacing: 0.00735em;
    }

    &__metamask-prompt {
        color: $secondary;
        cursor: pointer;
        width: max-content;
    }

    &__stats-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);

        gap: 12px;
        padding: 8px;

        @at-root .body--light & {
            color: $dark;
        }

        @media screen and (min-width: $breakpoint-sm-min) {flex-wrap: wrap;
            padding: 12px;
            max-width: fit-content;
            margin: 12px auto 16px;
        }

        @media screen and (min-width: $breakpoint-md-min) {
            margin: 0 0 24px auto;
        }
    }

    &__stat {
        $total-gutter: 48px;

        text-align: left;
        flex: 1 1 calc(33.33% - #{$total-gutter});
    }

    &__stat-label {
        font-size: 14px;
        white-space: nowrap;
    }

    &__stat-unit {
        display: inline-block;
        font-size: 10px;
        color: $secondary;
        transform: translateX(-2px);


        vertical-align: super;

        @at-root .body--light & {
            color: darken($secondary, 10%);
        }
    }

    &__stat-value {
        font-size: 18px;
        color: $primary;
        white-space: nowrap;
    }

    &__tabs-header {
        background: $dark;
        color: white;

        @at-root .body--light & {
            background: white;
            color: $dark;
        }
    }
}
</style>
