<script lang="ts">
import { getAntelope } from 'src/antelope';
import { defineComponent } from 'vue';

export const isTodayBeforeTelosCloudDown = new Date().getTime() < new Date('2023-12-31').getTime();

export default defineComponent({
    name: 'App',
    mounted() {
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
