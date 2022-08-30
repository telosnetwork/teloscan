<template>
<div class="c-staking-page pageContainer">
    <div class="row q-mx-md">
        <div class="c-staking-page__header col-xs-12 col-md-6">
            <h1 class="c-staking-page__title">
                Telos EVM Staking
            </h1>
            <span class="text-white">
                Stake sTLOS and receive sTLOS from the shared REX/EVM pool
            </span>
        </div>
        <div class="col-xs-12 col-md-6 c-staking-page__stats-section">

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
                                :total-unstaked="totalUnstakedTlosBalance"
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
import { mapGetters } from 'vuex';
import { fetchStlosApy, formatUnstakePeriod, promptAddToMetamask } from 'pages/staking/staking-utils';
import MetaMaskLogo from 'src/assets/metamask-fox.svg'

import { formatBN, WEI_PRECISION } from 'src/lib/utils';

import StakeForm from 'pages/staking/StakeForm';
import UnstakeForm from 'pages/staking/UnstakeForm';
import ClaimPage from 'pages/staking/ClaimPage.vue';

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
            // eztodo should this be in header or modal?
            return this.isLoggedIn && window.ethereum.isMetaMask === true;
        },
        unlockPeriodPretty() {
            return formatUnstakePeriod(this.unstakePeriodSeconds);
        },
        globalStats() {
            const exampleReturn = `1.${(this.stlosApy ?? '0').replace(/\./g, '')} TLOS`;
            return [{
                label: 'APY',
                value: this.stlosApy ?? '--',
                unit: '%',
                // eztodo we could do with more info here about how this interest is calculated
                // (what interval the compounding takes place on, if this percentage is fixed or under which conditions it may change),
                tooltip: 'APY: Annual Percentage Yield\n\nThe annual rate of return after taking compound interest into account.\n\n' +
                    'If you choose to stake your TLOS, this represents the rate at which you\'ll earn interest. This interest is ' +
                    'awarded in the form of TLOS when you unstake sTLOS, e.g.\nif you stake 1 TLOS and receive 1 sTLOS in return, ' +
                    `then wait exactly one year and redeem that sTLOS, you will receive ${exampleReturn}`,
            }, {
                label: 'TVL',
                value: this.formatWeiForStats(this.stlosTvl), // eztodo remove decimals
                unit: 'TLOS',
                // eztodo address 1. why the user should care about this number,
                // 2. caveats to making decisions based on this figure
                // 3. how this relates to REX / what it means to have a shared liquidity pool
                tooltip: 'TVL: Total Value Locked\n\nThe current value, in TLOS, of all assets held in the sTLOS ' +
                    '(Staked TLOS) smart contract, i.e. the sum of all staked TLOS at this moment.',
            }];
        },
        personalStats() {
            return {
                staked: {
                    label: 'Staked',
                    value: {
                        stlos: this.formatWeiForStats(this.stlosBalance),
                        tlos: this.formatWeiForStats(this.stlosValue),
                    },
                    tooltip: 'Staked\n\n' +
                        'The total staked amount associated with the logged-in account, i.e. ' +
                        'your sTLOS token balance, along with its value in TLOS',
                },
                unstaked: {
                    label: 'Unstaked',
                    value: this.formatWeiForStats(this.totalUnstakedTlosBalance),
                    tooltip: 'Unstaked\n\n' + // switch unstake to unstakesecondspretty
                        'The total value of TLOS which you have unstaked, both locked and unlocked.\n\n' +
                        'When you unstake\u2014i.e. redeem\u2014some value of sTLOS, the equivalent amount of ' +
                        `TLOS is sent into escrow ("locked") for ${this.unlockPeriodPretty}; during this time, ` +
                        'you cannot interact with this TLOS.\n\n' +
                        'After the unlock period has elapsed, you can claim your unlocked TLOS from the Claim tab ' +
                        'on this page, at which point it will be added to your account TLOS balance.',
                },
            };
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
            try {
                this.stlosTvl = await this.stlosContractInstance.totalAssets();
            } catch ({ message: tvlError }) {
                console.error(`Failed to fetch sTLOS TVL: ${tvlError}`);
                this.stlosTvl = null;
                this.stlosApy = null;

                return;
            }

            if (this.stlosTvl === null)
                return;

            try {
                this.stlosApy = await fetchStlosApy(this.$store.$api, this.stlosTvl);
            } catch ({ message: apyError }) {
                console.error(`Failed to fetch sTLOS APY: ${apyError}`);
                this.stlosApy = null;
            }
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
            const format = val => formatBN(val, WEI_PRECISION, 3);

            return wei === null ? '--' : format(wei);
        },
    },
}
</script>

<style scoped lang="scss">
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

    &__metamask-prompt {
        color: $secondary;
        cursor: pointer;
        width: max-content;
    }

    &__stats-section {
        display: flex;
        flex-wrap: wrap;

        @media screen and (min-width: $breakpoint-md-min) {
            justify-content: flex-end;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            flex-wrap: nowrap;
            gap: 16px;
        }
    }

    &__stats-container {
        height: min-content;

        &--global {
            flex-basis: 100%;

            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 32px;
            margin-bottom: 32px;

            @media screen and (min-width: $breakpoint-md-min) {
                justify-content: flex-end;
                margin: 0;
                padding: 0 0 12px;
            }

            @media screen and (min-width: $breakpoint-lg-min) {
                flex-basis: auto;
                padding: 12px;
            }
        }

        &--personal {
            display: flex;
            align-items: baseline;
            justify-content: space-evenly;
            gap: 24px;
            padding: 12px;
            margin-bottom: 24px;

            @media screen and (min-width: $breakpoint-sm-min) {
                max-width: max-content;
                margin: 0 auto 24px;
            }

            @media screen and (min-width: $breakpoint-md-min) {
                margin: 0 0 24px;
            }

            @media screen and (min-width: $breakpoint-lg-min) {
                margin: 0;
            }
        }
    }

    &__stat {
        width: fit-content;

        @media screen and (min-width: $breakpoint-md-min) {
            width: max-content;
        }

        &--global {
            position: relative;

            &:not(:last-of-type)::after {
                position: absolute;
                top: 0;
                right: -17px;
                bottom: 0;
                margin: auto;

                height: 80%;
                width: 1px;

                content: '';
                border-radius: 4px;
                background-color: #8591FD;
            }
        }

        &--personal {
            // text-align: center;
        }
    }

    &__stat-label {
        font-size: 14px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;

        &--global {
            color: $white;
        }

        &--personal {
            color: $dark;
        }
    }

    &__stat-unit {
        display: inline-block;
        font-size: 10px;
        color: $secondary;
        transform: translateX(-2px);


        vertical-align: super;

        &--personal {
            @at-root .body--light & {
                color: darken($secondary, 10%);
            }
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
