<template>
<div class="c-token-page pageContainer q-pt-xl">
    <div class="row">
        <div class="col-12 q-mb-sm">
            <img
                :src="headerTokenLogo"
                height="32"
                width="32"
                alt="Token icon"
                class="c-token-page__logo"
            >
            <span class="text-primary text-h4 q-px-sm">Token</span>
            <span class="text-grey">
                {{ headerTokenText }}
            </span>
        </div>
        <div class="col-12 text-white">
            <copy-button
                :text="address"
                :accompanying-text="address"
                description="address"
            />
            <p v-if="showTokenHeaderInfo">
                Created at trx <transaction-field :transaction-hash="tokenInfo.transaction" /><br>
                by address <address-field :address="tokenInfo.creator" />
            </p>
            <router-link :to="`/address/${address}`">
                Go to {{ showTokenHeaderInfo ? 'Contract' : 'Address' }} Info page
            </router-link>
        </div>
    </div>
    <div v-if="selectedTab" class="c-token-page__body">
        <q-tabs
            v-model="selectedTab"
            dense
            active-color="secondary"
            align="justify"
            narrow-indicator
            :class="qtabsClasses"
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
import AddressField from 'src/components/AddressField';
import CopyButton from 'src/components/CopyButton';
import TransactionField from 'src/components/TransactionField';

import TokenHolders from 'pages/token/TokenHolders';
import TokenTransfers from 'pages/token/TokenTransfers';

import { toChecksumAddress } from 'src/lib/utils';

const genericLogo = require('assets/telos-logo--evm-generic.png');

const tabs = {
    holders: '#holders',
    transfers: '#transfers',
};

export default {
    name: 'TokenPage',
    components: {
        AddressField,
        CopyButton,
        TokenHolders,
        TokenTransfers,
        TransactionField,
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
        showTokenHeaderInfo() {
            return ['creator', 'transaction'].every(property => !!this.tokenInfo?.[property]);
        },
        qtabsClasses() {
            const extraClasses = this.$q.dark.isActive ? 'q-dark text-white' : 'text-black';
            return `c-token-page__tabs-header tabsBar topRounded tableWrapper ${extraClasses}`;
        },
    },
    watch: {
        $route: {
            deep: true,
            immediate: true,
            handler(newRoute, oldRoute = {}) {
                const { hash: oldHash, path: oldPath } = oldRoute;
                const { hash: newHash, path: newPath } = newRoute;

                if (oldHash === newHash && oldPath === newPath) return;

                const tabNames = Object.values(this.tabs);
                const hash = newHash?.replace('#', '') ?? '';
                const shouldAddTransfersHash = !tabNames.includes(hash);

                const urlPath = newPath.replace('/token/', '');
                const urlPathChecksum = toChecksumAddress(urlPath) ?? '';
                const pathNeedsFormatting =
                    urlPath !== urlPathChecksum &&
                    urlPath.toLowerCase() === urlPathChecksum.toLowerCase();

                const newRouteOpts = {
                    hash: shouldAddTransfersHash ? tabs.transfers : newHash,
                };

                if (pathNeedsFormatting) {
                    newRouteOpts.path = `/token/${this.address}`;
                }

                this.$router.replace({ ...newRouteOpts });
            },
        },
    },
    methods: {
        handleTokenInfoLoaded(tokenContractMeta) {
            this.tokenInfo = { ...tokenContractMeta };
        },
    },
}
</script>

<style lang="scss">
.c-token-page {
    &__logo {
        height: 32px;
        width: 32px;
        vertical-align: sub;
    }

    &__tabs-header {
        background: white;

        &.q-dark {
            background: $dark;
        }
    }
}


</style>
