<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChainStore } from 'src/core';

const { t: $t } = useI18n();
const loadingComplete = ref(false);

defineProps({
    required: {
        type: String,
        required: true,
    },
});

const current = ref('...');
const settings = computed(() => useChainStore().currentChain.settings);
const state = computed(() => settings.value.indexerHealthState);

const updateData = async () => {
    loadingComplete.value = false;
    try {
        if (typeof state.value.version === 'undefined') {
            return;
        }
        current.value = state.value.version;
        loadingComplete.value = true;
    } catch(e) {
        console.error(e);
    }
};

onBeforeMount(async () => {
    useChainStore().currentChain.settings.indexerReady$.subscribe(() => {
        updateData();
    });
});

watch(() => useChainStore().currentChain.settings.indexerHealthState.version, () => {
    updateData();
});

</script>

<template>
<q-card class="c-minimum-version-required c-minimum-version-required__card">
    <q-card-section class="c-minimum-version-required__card-section c-minimum-version-required__card-section--title">
        <q-icon name="info" class="c-minimum-version-required__not-supported-icon" />
        <div class="c-minimum-version-required__not-supported-text">
            {{ $t('pages.indexer_outdated_title', {
                network: settings.getDisplay(),
            }) }}
        </div>
    </q-card-section>
    <q-card-section class="c-minimum-version-required__card-section">
        <!--
            indexer_outdated_desc_1: '(Need version { version } but ',
            indexer_outdated_desc_2: '{ apiUrl }',
            indexer_outdated_desc_3: ' is version { current })',
        -->
        <span class="c-minimum-version-required__not-supported-text">
            {{ $t('pages.indexer_outdated_desc_1', {
                version: required,
            }) }}
        </span>
        <a
            color="primary"
            class="c-minimum-version-required__not-supported-text"
            :href="`${settings.getIndexerApiEndpoint()}/v1/health`"
            target="_blank"
        >
            {{ $t('pages.indexer_outdated_desc_2', {
                apiUrl: settings.getIndexerApiEndpoint(),
            }) }}
        </a>
        <span class="c-minimum-version-required__not-supported-text">
            {{ $t('pages.indexer_outdated_desc_3', {
                current: current,
            }) }}
        </span>
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-minimum-version-required {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    &__card {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        &-section {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
            word-wrap: break-word;
            &--title {
                flex-direction: row;
                padding: 25px 0 10px 0;
                font-size: 18px
            }
        }
    }

    &__not-supported-icon {
        font-size: 24px;
    }

    @media screen and (min-width: $breakpoint-md-min) {
        width: 70%;
        &__card-section {
            flex-direction: row;
        }
    }
}
</style>
