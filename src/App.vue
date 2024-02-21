<script lang="ts" setup>
import { onMounted } from 'vue';

import { useChainStore } from 'src/antelope';
import { TELOS_NETWORK_NAMES } from 'src/antelope/mocks/chain-constants';

onMounted(() => {
    const network = useChainStore().currentChain.settings.getNetwork();
    if (TELOS_NETWORK_NAMES.includes(network)) {
        const script = document.createElement('script');
        script.src = 'https://cdn.usefathom.com/script.js';
        script.dataset.site = 'PDKJSBKL';
        script.dataset.spa = 'auto';
        script.defer = true;
        document.body.appendChild(script);
    }
});

</script>
<template>
<div id="q-app">
    <router-view />
</div>
</template>
