<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import moment from 'moment';

import { getCore, useChainStore } from 'src/core';

import { TELOS_NETWORK_NAMES } from 'src/config/chains';
import { providerManager } from 'src/boot/evm';
import { useRoute } from 'vue-router';

const $store = useStore();
const { t: $t } = useI18n();
const $q = useQuasar();
const $route = useRoute();

// computed
const isNative = computed(() => $store.getters['login/isNative']);

const checkNetworkHealth = async () => {
    const network = useChainStore().currentChain.settings.getNetwork();
    if (TELOS_NETWORK_NAMES.includes(network)) {
        const script = document.createElement('script');
        script.src = 'https://cdn.usefathom.com/script.js';
        script.dataset.site = 'PDKJSBKL';
        script.dataset.spa = 'auto';
        script.defer = true;
        document.body.appendChild(script);
    }
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    const chainName = useChainStore().currentChain.settings.getDisplay();
    const threshold = useChainStore().currentChain.settings.getIndexerSecondsBehindThreshold();
    const theme = $q.dark.isActive ? useChainStore().currentChain.settings.getThemes().dark : useChainStore().currentChain.settings.getThemes().light;
    const health = await indexerApi.get('/v1/health');
    const background = theme?.primary || '#0099FF';
    const color = theme?.color || 'white';
    // print in console with background #8B3F98 and white text the following message: Using indexer {health.data.version} with {health.data.secondsBehind} seconds behind
    console.debug(
        `%cUsing indexer ${health.data.version} for '${chainName}' ` +
        (health.data?.secondsBehind > 3 ? `with ${health.data.secondsBehind} seconds behind` : ''),
        `background: ${background}; color: ${color};`,
    );

    if (health.data?.secondsBehind > threshold) {
        let behindBy = moment(health.data.secondsBehind * 1000).utc().format('HH:mm:ss');
        if (health.data?.secondsBehind > 86400) {
            const behindByHours = Math.round(health.data.secondsBehind / 60 / 60);
            const behindByDays = Math.floor(health.data.secondsBehind / 60 / 60 / 24);
            const behindByLeft = behindByHours - (behindByDays * 24);
            const behindByLeftStr = (behindByLeft === 0)
                ? ''
                : $t('global.and') + ' ' + behindByLeft + ' ' + $t('global.hours');
            behindBy = (behindByDays > 0)
                ? behindByDays + ' ' + $t('global.days') + ' ' + behindByLeftStr
                : behindByHours + ' ' + $t('global.hours');
        }
        $q.notify({
            type: 'negative',
            timeout: 12000,
            progress: true,
            message: $t('global.not_synced'),
            caption: $t('global.data_behind_by') + ' <strong>' +
                behindBy + '</strong>. <br>' + $t('global.try_reloading'),
            html: true,
        });
    }
};

onMounted(async () => {
    await checkNetworkHealth();

    // On login we must set the address and record the provider
    getCore().events.onLoggedOut.subscribe(() => {
        const loginData = localStorage.getItem('loginData');
        if (isNative.value) {
            if (!loginData) {
                return;
            }
            const loginObj = JSON.parse(loginData);
            const wallet = getCore().config.authenticatorsGetter().find(a => a.getName() === loginObj.provider);
            wallet?.logout();
        }
        $store.commit('login/setLogin', {});
        localStorage.removeItem('loginData');
        providerManager.setProvider(null);
    });

    if (useChainStore().currentChain.settings.getBranding().tab) {
        document.title = useChainStore().currentChain.settings.getBranding().tab;
    } else if (useChainStore().currentChain.settings.isTestnet()) {
        // if the network is testnet we include the word testnet in the title of the page
        document.title = `${document.title} Testnet`;
    }

});

// Watch for changes in the route query to react when network changes
watch(
    () => $route.query.network,
    async (newNetwork, oldNetwork) => {
        if (newNetwork !== oldNetwork) {
            await checkNetworkHealth();
        }
    },
);

</script>

<template>
<div id="q-app">
    <router-view />
</div>
</template>
