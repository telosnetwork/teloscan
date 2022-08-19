<template>
<div class="c-staking-page pageContainer q-pt-xl">
    <div class="row page-header q-mx-md q-mb-lg">
        <div class="col-xs-12 col-lg-6">
            <h1 class="c-staking-page__title">
                Telos EVM Staking
            </h1>
            <p class="text-white">
                Stake sTLOS and receive sTLOS from the shared REX/EVM pool
            </p>
        </div>
        <div class="col-xs-12 col-lg-6 c-staking-page__stats-container shadow-1">
            <div
                v-for="{ label, value, unit } in stats"
                :key="label"
                class="c-staking-page__stat"
            >
                <div class="c-staking-page__stat-label">
                    {{ label }}
                    <div class="c-staking-page__stat-unit">
                        {{ unit }}
                    </div>
                </div>

                <div class="c-staking-page__stat-value">
                    {{ value || '--' }}
                </div>
            </div>
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
            </q-tabs>

            <q-tab-panels
                v-model="selectedTab"
                animated
                keep-alive
                class="q-py-lg"
            >
                <q-tab-panel name="stake">
                    <stake-form />
                </q-tab-panel>
                <q-tab-panel
                    name="unstake"
                    class="shadow-2"
                >
                    <unstake-form />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import StakeForm from 'pages/staking/StakeForm';
import UnstakeForm from 'pages/staking/UnstakeForm';

const tabs = {
    stake: 'stake',
    unstake: 'unstake',
}

export default {
    name: 'StakingPage',
    components: {
        StakeForm,
        UnstakeForm,
    },
    data: () => ({
        tabs,
        selectedTab: tabs.stake,
    }),
    computed: {
        ...mapState('staking', [
            'tlosBalance',
            'stlosBalance',
        ]),
        ...mapGetters('staking', [
            'tlosBalancePretty',
            'redeemableStlosBalance',
        ]),
        ...mapGetters('login', ['address', 'isLoggedIn']),
        stats() {
            return [{
                label: 'Balance',
                value: this.tlosBalancePretty,
                unit: 'TLOS',
            }, {
                label: 'Staked',
                value: this.stlosBalance,
                unit: 'STLOS',
            }, {
                label: 'Unlocked',
                value: this.redeemableStlosBalance,
                unit: 'STLOS',
            }];
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
            handler(address, oldAddress) {
                if (address && address !== oldAddress) {
                    this.refreshBalances(address);
                }
            },
        },
    },
    created() {
        // eztodo pickup here on 8/20 - call stack overflow, see src/boot/evm.js
        // error did not occur in before this commit; find a way around it
        // also, this may break if user is not signed in, check if provider with no signer is needed for logged out case
        this.fetchStlosContract({
            contractManager: this.$contractManager,
            providerManager: this.$providerManager,
        });
        this.fetchEscrowContract();
        // this.refreshBalances();
    },
    methods: {
        ...mapActions('staking', [
            'fetchStlosContract',
            'fetchEscrowContract',
            'fetchAccountTlosBalance',
            'fetchAccountStlosBalance',
        ]),
        refreshBalances(address) {
            this.fetchAccountTlosBalance(address);
            // this.fetchAccountStlosBalance();
        },
    },
}
</script>

<style lang="scss">
.c-staking-page {
    &__title {
        color: $primary;
        margin: 0 0 12px;
        font-size: 2.125rem;
        font-weight: 400;
        line-height: 2rem;
        letter-spacing: 0.00735em;
    }

    &__stats-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;

        background-color: $dark;
        justify-content: space-between;
        border-radius: 10px;

        @media screen and (min-width: $breakpoint-sm-min) {
            margin-top: 24px;
            padding: 8px 16px;
            justify-content: space-evenly;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            box-shadow: unset;
            background-color: unset;
            justify-content: flex-end;
            margin: 0;
            padding: 0;
        }

        @at-root .body--light & {
            background: white;
            color: $dark;

            @media screen and (min-width: $breakpoint-lg-min) {
                color: white;
                background-color: unset;
            }
        }
    }

    &__stat {
        text-align: left;
        width: min-content;
        padding: 8px;
        margin: 0 4px;
        border-radius: 10px;

        &:first-of-type {
            margin-left: 0;
        }

        &:last-of-type {
            margin-right: 0;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            text-align: center;
            flex-wrap: nowrap;
            padding: 16px;
            background-color: rgba(black, 0.12);
        }
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

        @media screen and (min-width: $breakpoint-lg-min) {
            vertical-align: super;
        }

        @at-root .body--light & {
            color: darken($secondary, 10%);
        }
    }

    &__stat-value {
        font-size: 16px;
        line-height: 1.5rem;
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
