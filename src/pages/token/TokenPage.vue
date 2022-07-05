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
                <token-transfers
                    :address="address"
                    @token-info-loaded="handleTokenInfoLoaded"
                />
            </q-tab-panel>
            <q-tab-panel name="holders" class="shadow-2">
                <token-holders
                    :address="address"
                    @token-info-loaded="handleTokenInfoLoaded"
                />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</div>
</template>

<script>
import TokenHolders from 'pages/token/TokenHolders';
import TokenTransfers from 'pages/token/TokenTransfers';

import { toChecksumAddress } from 'src/lib/utils';

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
        tokenInfo: null,
    }),
    computed: {
        address() {
            return toChecksumAddress(this.$route.params?.address);
        },
        headerTokenText() {
            if (!this.tokenInfo) {
                return 'Loading...';
            }

            const { name, symbol } = this.tokenInfo;

            if (name && symbol) {
                return `${name} (${symbol})`;
            }

            return 'Unknown Token';
        },
        headerTokenLogo() {
            return this.tokenInfo?.logoURI ?? genericLogo;
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
        '$route.path': {
            handler(newPath) {
                const urlPath = newPath.replace('/token/', '');
                const urlPathChecksum = toChecksumAddress(urlPath);
                const pathNeedsFormatting =
                    !!urlPathChecksum &&
                    urlPath !== urlPathChecksum &&
                    urlPath.toLowerCase() === urlPathChecksum.toLowerCase();

                if (pathNeedsFormatting) {
                    this.$router.replace(`/token/${this.address}`);
                }
            },
            immediate: true,
        },
    },
    methods: {
        handleTokenInfoLoaded(tokenContractMeta) {
            this.$set(this, 'tokenInfo', { ...tokenContractMeta });
        },
    },
}
</script>

<style lang="scss">
</style>
