<template>
<div class="c-token-page pageContainer q-pt-xl">
    <div class="c-token-page__header q-mb-md">
        <img
            :src="headerTokenLogo"
            height="32"
            width="32"
            alt="Token icon"
            style="vertical-align:sub;"
        >
        <span class="text-primary text-h4 q-px-sm">Token</span>
        <span class="text-grey">
            {{ headerTokenText }}
        </span>
        <!-- eztodo handle address not found / not a token contract -->
    </div>
    <div class="c-token-page__overview" />
    <div v-if="selectedTab" class="c-token-page__body">
        <q-tabs
            v-model="selectedTab"
            dense
            active-color="secondary"
            align="justify"
            narrow-indicator
            class="tabsBar topRounded text-white tableWrapper tabs-header"
            :class="{ 'q-dark': $q.dark.isActive }"
        >
            <q-route-tab
                name="transfers"
                to="#transfers"
                exact
                push
                label="Transfers"
            />
            <q-route-tab
                name="holders"
                to="#holders"
                exact
                push
                label="Holders"
            />
        </q-tabs>

        <q-tab-panels
            v-model="selectedTab"
            animated
            keep-alive
        >
            <q-tab-panel name="transfers">
                <token-transfers :address="address" />
            </q-tab-panel>
            <q-tab-panel name="holders" class="shadow-2">
                <token-holders :address="address" />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</div>
</template>

<script>
import TokenHolders from 'pages/token/TokenHolders';
import TokenTransfers from 'pages/token/TokenTransfers';

const genericLogo = require('assets/telos-logo--evm-generic.png');

const tabs = {
    holders: 'holders',
    transfers: 'transfers',
};

export default {
    name: 'TokenPage',
    components: {
        TokenHolders,
        TokenTransfers,
    },
    data: () => ({
        tabs,
        selectedTab: tabs.transfers,
    }),
    computed: {
        token() {
            return this.$contractManager.getToken(this.address);
        },
        address() {
            return this.$route.params?.address?.toLowerCase() ?? '';
        },
        headerTokenText() {
            const { name, symbol } = this.token || {};

            if (name && symbol) {
                return `${name} (${symbol})`;
            }
            return 'Unknown Token';
        },
        headerTokenLogo() {
            return this.token?.logoURI ?? genericLogo;
        },
    },
    watch: {
        '$route.hash': {
            handler(newHash) {
                const tabNames = Object.values(this.tabs);
                const hash = newHash?.replace('#', '') ?? '';

                if (!tabNames.includes(hash)) {
                    this.$router.replace({ hash: this.tabs.transfers });
                }
            },
            immediate: true,
        },
    },
    methods: {

    },
}
</script>

<style lang="scss">
</style>
