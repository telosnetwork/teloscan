<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';


import InternalTransactionFlatTable from 'components/InternalTransactionFlatTable.vue';
import AddressField from 'components/AddressField.vue';

const { t: $t } = useI18n();
const route = useRoute();
/// const address = computed(() => route.query.a as string);
const address = ref<string>(route.query.a as string);

// watch the route url and if it chenges update the address
watch(() => route.query.a, () => {
    address.value = route.query.a as string ? route.query.a as string : '';
},
{ immediate: true });

</script>

<template>
<q-page class="c-internal-trx">

    <div class="c-internal-trx__header">
        <div class="c-internal-trx__header-title">{{ $t('pages.internaltrx.page_title') }}</div>
        <div v-if="address" class="c-internal-trx__header-sub-title">{{ $t('pages.internaltrx.for_address') }}
            <AddressField
                :address="address"
            />
        </div>
    </div>

    <div class="c-internal-trx__body">
        <q-card>
            <InternalTransactionFlatTable
                :address="address"
                :usePagination="true"
            />
        </q-card>
    </div>

</q-page>
</template>

<style lang="scss">

.c-internal-trx {
    @include page-container;

    &__header {
        @include page-header;

        &-sub-title {
            --q-primary: var(--text-color);
        }
    }
}

</style>
