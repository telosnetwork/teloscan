<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BlockTable from 'components/BlockTable.vue';

const { t: $t } = useI18n();

const showEmptyBlocks = ref(false);

</script>

<template>
<q-page class="c-blocks">

    <div class="c-blocks__header">
        <span class="c-blocks__header-title">{{ $t('pages.blocklist.title') }}</span>
    </div>

    <div class="c-blocks__body">
        <q-card>
            <q-toggle
                v-model="showEmptyBlocks"
                class="c-blocks__toggle"
                label="display empty blocks"
                color="primary"
                checked-icon="visibility"
                unchecked-icon="visibility_off"
            />
            <BlockTable :showEmptyBlocks='showEmptyBlocks' class="c-blocks__block-table" :title="'Block List'"/>
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">
.c-blocks {
    @include page-container;

    &__header {
        @include page-header;
        &-nav-btn {
            @include page-header-nav-btn;
        }
    }

    &__tabs {
        @include tabs-container;
    }

    &__body {
        @include page-body;
    }

    &__toggle {
        margin: .5rem;
    }
}

</style>
