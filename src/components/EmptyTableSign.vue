<script lang="ts" setup>
// src/components/EmptyTableSign.vue
import { useI18n } from 'vue-i18n';
const $i18n = useI18n();
const { t: $t } = $i18n;

</script>

<template>
<div class="c-empty-table-sign">
    <div class="c-empty-table-sign-title">
        <q-icon
            class="c-empty-table-sign-title-icon"
            name="fa fa-table"
        />
        {{ $t('components.no_matching_entries') }}
    </div>
    <div class="c-empty-table-sign-description">
        {{ $t('components.please_try_again_later') }}
    </div>
</div>

</template>

<style lang="scss">
.c-empty-table-sign {
    padding: 20px;
    text-align: center;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    &-title {
        font-size: 1.2rem;
        margin-bottom: 10px;
        &-icon {
            font-size: 1.2rem;
            margin-right: 5px;
            margin-top: -7px;
        }
    }
    &-description {
        font-size: 0.8rem;
    }
}
</style>

