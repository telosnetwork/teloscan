<template>
<div class="pageContainer q-pt-xl">
    <div class="row q-mx-md q-mb-lg">
        <div class="col-12 text-primary text-h4 q-mb-sm">
            Telos EVM Staking
        </div>
        <div class="col-12">
            <p>Stake sTLOS and receive sTLOS from the shared REX/EVM pool</p>
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
                :class="qtabsClasses"
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
        stakedAmount: 0,
    }),
    computed: {
        qtabsClasses() {
            const extraClasses = this.$q.dark.isActive ? 'q-dark text-white' : 'text-black';
            return `c-staking-page__tabs-header tabsBar topRounded tableWrapper ${extraClasses}`;
        },
    },
    watch: {
        ['$route.hash'](newHash, oldHash) {
            if (oldHash === newHash) return;

            const hash = newHash?.replace('#', '') ?? '';
            const tabNames = Object.values(this.tabs);

            const shouldAddStakeHash = !tabNames.includes(hash);

            if (shouldAddStakeHash) this.$router.replace({ hash });
        },
    },
}
</script>

<style lang="scss">
.c-staking-page {
    &__tabs-header {
        background: white;

        &.q-dark {
            background: var(--q-color-dark);
        }
    }
}
</style>
