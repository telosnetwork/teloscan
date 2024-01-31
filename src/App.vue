<script lang="ts">
import { defineComponent } from 'vue';

import { getAntelope, useChainStore } from 'src/antelope';
import { TELOS_NETWORK_NAMES } from 'src/antelope/mocks/chain-constants';

export const isTodayBeforeTelosCloudDown = new Date().getTime() < new Date('2023-12-31').getTime();

export default defineComponent({
    name: 'App',
    mounted() {
        const network = useChainStore().currentChain.settings.getNetwork();
        if (TELOS_NETWORK_NAMES.includes(network)) {
            const script = document.createElement('script');
            script.src = 'https://cdn.usefathom.com/script.js';
            script.dataset.site = 'PDKJSBKL';
            script.dataset.spa = 'auto';
            script.defer = true;
            document.body.appendChild(script);
        }

        if (isTodayBeforeTelosCloudDown) {
            getAntelope().config.notifyRememberInfoHandler(
                this.$t('temporal.telos_cloud_discontinued_title'),
                [{
                    tag: 'p',
                    class: 'c-notify__message--subtitle',
                    text: this.$t('temporal.telos_cloud_discontinued_message_title'),
                }, {
                    tag: 'p',
                    class: '',
                    text: this.$t('temporal.telos_cloud_discontinued_message_body'),
                }],
                '',
                'telos-cloud-discontinued',
            );
        }
    },
});
</script>
<template>
<div id="q-app">
    <router-view />
</div>
</template>
