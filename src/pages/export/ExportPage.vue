<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';
import { parseAddressString } from 'src/lib/function-interface-utils';

import AddressInput from 'src/components/inputs/AddressInput.vue';

const route = useRoute();
const router = useRouter();

// eztodo i18n
const exportTypes = [{
    label: 'Transactions',
    value: EXPORT_DOWNLOAD_TYPES.transactions,
}, {
    label: 'ERC-20 Transfers',
    value: EXPORT_DOWNLOAD_TYPES.erc20Transfers,
}, {
    label: 'ERC-721 Transfers',
    value: EXPORT_DOWNLOAD_TYPES.erc721Transfers,
}, {
    label: 'ERC-1155 Transfers',
    value: EXPORT_DOWNLOAD_TYPES.erc1155Transfers,
}];

const downloadRangeTypes = {
    date: 'date',
    block: 'block',
};

// data
const accountModel = ref('');
const accountInputRef = ref<null | typeof AddressInput>(null);
const typeSelectModel = ref(exportTypes[0]);
const downloadRangeType = ref(downloadRangeTypes.date);
const dateRange = ref({ to: '', from: '' });

// computed
const enableDownloadButton = computed(() => !!parseAddressString(accountModel.value));

// watchers
watch(accountModel, () => {
    router.replace({
        query: {
            ...route.query,
            account: accountModel.value,
        },
    });
});

watch(typeSelectModel, () => {
    if (typeSelectModel.value) {
        router.replace({
            query: {
                ...route.query,
                type: typeSelectModel.value.value,
            },
        });
    }
});

// methods
function resetOptions() {
    accountModel.value = '';
    typeSelectModel.value = exportTypes[0];
    accountInputRef.value?.resetValidation();
}

function download() {
    // eztodo download
    console.log('download', accountModel.value, typeSelectModel.value);
}

onMounted(() => {
    if (route.query?.account) {
        accountModel.value = route.query.account as string;
    }

    if (Object.values(EXPORT_DOWNLOAD_TYPES).includes((route.query?.type ?? '') as string)) {
        typeSelectModel.value = exportTypes.find(type => type.value === route.query.type) as { label: string; value: string };
    }
});
</script>

<template>
<!-- eztodo i18n -->
<div class="pageContainer q-pt-lg">
    <h1 class="text-primary text-h4 q-pb-md">Download Data (CSV Export)</h1>

    <q-card>
        <div class="q-pa-lg">
            <div class="row q-mb-md">
                <div class="col-12 col-md-6 col-lg-3">
                    <q-select
                        v-model="typeSelectModel"
                        :options="exportTypes"
                        label="Export type"
                    />
                </div>
            </div>

            <div class="row q-mb-xl">
                <div class="col-12 col-md-6 col-lg-4">
                    <AddressInput
                        ref="accountInputRef"
                        v-model="accountModel"
                        label="Account"
                        required="required"
                        name="export-account"
                    />
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    Choose download option:
                    <br>
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.date"
                        label="Date"
                    />
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.block"
                        label="Block Number"
                    />
                </div>
            </div>

            <div class="row">
                <div v-if="downloadRangeType === downloadRangeTypes.date" class="col-4">
                    <q-input
                        :model-value="`${dateRange.from} - ${dateRange.to}`"
                        filled
                        mask="date"
                        :rules="['date']"
                        label="Start Date"
                        class="q-mr-md"
                    >
                        <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                    <q-date
                                        v-model="dateRange"
                                        minimal
                                        range
                                        color="secondary"
                                    >
                                        <div class="row items-center justify-end">
                                            <q-btn
                                                v-close-popup
                                                label="Close"
                                                color="primary"
                                                flat
                                            />
                                        </div>
                                    </q-date>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <q-btn
                        :disable="!enableDownloadButton"
                        label="Download CSV"
                        icon="download"
                        color="secondary"
                        class="q-mr-md"
                        @click="download"
                    />
                    <q-btn
                        label="Reset"
                        flat
                        color="secondary"
                        @click="resetOptions"
                    />
                </div>
            </div>
        </div>
    </q-card>
</div>
</template>
