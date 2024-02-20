<script lang="ts" setup>
import Endpoints from 'components/Health/Endpoints.vue';
import Monitor from 'components/Health/Monitor.vue';

</script>

<template>
<div class="c-health-page q-pt-xl">
    <div class="homeInfo q-mb-lg">
        <div class="text-primary text-h6">{{ $t('pages.rpc_endpoints') }}</div>
    </div>
    <Endpoints/>
    <div class="homeInfo q-mb-lg">
        <div class="text-primary text-h6">{{ $t('pages.monitor') }}</div>
    </div>
    <Monitor/>
</div>
</template>

<style lang="scss">
.c-health-page {
    flex: 0 1 1200px;
    margin: auto;
    max-width: 1200px;
}
</style>
