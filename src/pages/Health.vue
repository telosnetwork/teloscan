<script>
import Endpoints from '../components/Health/Endpoints.vue';
import Monitor from '../components/Health/Monitor.vue';
export default {
    name: 'HealthPage',
    components: {Endpoints, Monitor},
};
</script>
<template lang="pug">
.pageContainer.q-pt-xl
    .homeInfo.q-mb-lg
        .text-primary.text-h6 RPC Endpoints
    Endpoints()
    .homeInfo.q-mb-lg
        .text-primary.text-h6 Monitor
    Monitor()
</template>

<style scoped lang='sass'>

</style>
