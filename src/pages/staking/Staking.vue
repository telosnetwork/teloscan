<template>
<div class="pageContainer q-pt-xl">
    <div class="row">
        <div class="page-header row q-mx-md q-mb-lg">
            <div class="col-12 text-primary text-h4 q-mb-sm">
                Telos EVM Staking
            </div>
            <div class="col-12 text-white">
                <p>Stake sTLOS and receive sTLOS from the shared REX/EVM pool</p>
            </div>
        </div>
        <div class="dataCardsContainer">
            <div
                class="dataCardItem"
            >
                <div class="row">
                    <div class="data-card">
                        <div class="dataCardTile">
                            Balance
                        </div>
                        <div class="dataCardData">
                            <a
                                href=""
                                target="_blank"
                            > 4.56 </a>
                        </div>
                    </div>
                    <div class="data-card">
                        <div class="dataCardTile">
                            Staked
                        </div>
                        <div class="dataCardData">
                            <a
                                href=""
                                target="_blank"
                            > 4.56 </a>
                        </div>
                    </div>
                    <div class="data-card">
                        <div class="dataCardTile">
                            Unlocked
                        </div>
                        <div class="dataCardData">
                            <a
                                href=""
                                target="_blank"
                            > 4.56 </a>
                        </div>
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
        stlosContract: null,
        account: null,
    }),
    computed: {
        qtabsClasses() {
            const extraClasses = this.$q.dark.isActive ? 'q-dark text-white' : 'text-black';
            return `c-staking-page__tabs-header tabsBar topRounded tableWrapper ${extraClasses}`;
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
    },
    async created() {
        try{
            this.stlosContract = await (await this.$contractManager.getContract(process.env.STLOS_CONTRACT_ADDRESS)).getContractInstance();
        }catch(e){
            console.error(`Failed to get sTLOS contract instance: ${e.message}`);
        }
    },
}
</script>

<style lang="sass">
.c-staking-page 
    &__tabs-header 
        background: white
        &.q-dark 
            background: var(--q-color-dark)

.dataCardsContainer .dataCardItem    
    margin-left: auto
    width: fit-content
    height: 5rem

.data-card
    display: flex
    flex-direction: column
    justify-content: center
    margin-left:.5rem

.page-header
    width:fit-content
</style>
