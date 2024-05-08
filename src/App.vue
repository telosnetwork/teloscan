<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import moment from 'moment';

import { getAntelope, useChainStore } from 'src/antelope';
import { TELOS_NETWORK_NAMES } from 'src/antelope/mocks/chain-constants';
import { indexerApi } from 'src/boot/telosApi';
import { ual } from 'src/boot/ual';
import { providerManager } from 'src/boot/evm';

const $store = useStore();
const { t: $t } = useI18n();
const $q = useQuasar();

// computed
const isNative = computed(() => $store.getters['login/isNative']);

onMounted(async () => {
    const network = useChainStore().currentChain.settings.getNetwork();
    if (!process.env.SERVER && TELOS_NETWORK_NAMES.includes(network)) {
        const script = document.createElement('script');
        script.src = 'https://cdn.usefathom.com/script.js';
        script.dataset.site = 'PDKJSBKL';
        script.dataset.spa = 'auto';
        script.defer = true;
        document.body.appendChild(script);
    }

    const health = await indexerApi.get('/health');

    if (health.data?.secondsBehind > 3) {
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

    // On login we must set the address and record the provider
    getAntelope().events.onLoggedOut.subscribe(() => {
        const loginData = localStorage.getItem('loginData');
        if (isNative.value) {
            if (!loginData) {
                return;
            }
            const loginObj = JSON.parse(loginData);
            const wallet = ual.getAuthenticators().availableAuthenticators.find(a => a.getName() === loginObj.provider);
            wallet?.logout();
        }
        $store.commit('login/setLogin', {});
        localStorage.removeItem('loginData');
        providerManager.setProvider(null);
    });
});

</script>
<template>
<div id="q-app">
    <router-view />
</div>
</template>
