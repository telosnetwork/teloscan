<script setup lang="ts">
import {
    computed,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';
import { parseAddressString } from 'src/lib/function-interface-utils';

import AddressInput from 'src/components/inputs/AddressInput.vue';

declare const hcaptcha: {
    /* eslint-disable-next-line no-unused-vars */
    render: (id: string, options: { sitekey: string; theme: string; callback: string }) => void;
};

const TELOSCAN_HCAPTCHA_SITEKEY = '885ed0ce-c4ed-439e-a7c0-1ad3b3727f5b';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

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
const startBlockModel = ref('');
const endBlockModel = ref('');
const captchaSucceeded = ref(false);

// computed
const enableDownloadButton = computed(() => {
    const isNumber = (val: string) => /^\d+$/.test(val);

    const addressIsValid = !!parseAddressString(accountModel.value);
    const dateRangeIsValid = dateRange.value.from && dateRange.value.to;
    const blockRangeIsValid = isNumber(startBlockModel.value) && isNumber(endBlockModel.value);

    return addressIsValid &&
        captchaSucceeded.value &&
        (
            (downloadRangeType.value === downloadRangeTypes.date && dateRangeIsValid) ||
            (downloadRangeType.value === downloadRangeTypes.block && blockRangeIsValid)
        );
});
const dateTextInputModel = computed(() =>
    (dateRange.value.from && dateRange.value.to) ? `${dateRange.value.from} - ${dateRange.value.to}` : '',
);

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
}, { immediate: true });

watch(downloadRangeType, () => {
    startBlockModel.value = '';
    endBlockModel.value = '';
    dateRange.value = { to: '', from: '' };
});

// methods
function resetOptions() {
    accountModel.value = '';
    typeSelectModel.value = exportTypes[0];
    accountInputRef.value?.resetValidation();
    startBlockModel.value = '';
    endBlockModel.value = '';
    dateRange.value = { to: '', from: '' };
}

function download() {
    // eztodo download
    console.log('download', accountModel.value, typeSelectModel.value);
}

function hCaptchaLoadHandler() {
    hcaptcha.render('export-page-captcha', {
        sitekey: TELOSCAN_HCAPTCHA_SITEKEY,
        theme: $q.dark.isActive ? 'dark' : 'light',
        callback: 'teloscanHCaptchaSuccessHandler',
    });
}

function hCaptchaSuccessHandler() {
    captchaSucceeded.value = true;
}

onMounted(() => {
    // hCaptcha requires this global function
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).teloscanHCaptchaSuccessHandler = hCaptchaSuccessHandler;
    (window as any).teloscanHCaptchaLoadHandler = hCaptchaLoadHandler;
    /* eslint-enable */

    const hcaptchaScript = document.createElement('script');
    hcaptchaScript.src = 'https://js.hcaptcha.com/1/api.js';
    hcaptchaScript.async = true;
    hcaptchaScript.defer = true;
    hcaptchaScript.onload = hCaptchaLoadHandler;
    document.body.appendChild(hcaptchaScript);

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
                <div class="col-12 col-md-6 col-lg-2">
                    <q-select
                        v-model="typeSelectModel"
                        :options="exportTypes"
                        color="secondary"
                        label="Export type"
                    />
                </div>
            </div>

            <div class="row q-mb-lg">
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

            <div class="row q-mb-md">
                <div class="col-12">
                    Choose download option:
                    <br>
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.date"
                        color="secondary"
                        label="Date"
                    />
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.block"
                        color="secondary"
                        label="Block Number"
                    />
                </div>
            </div>

            <div class="row q-mb-xl">
                <div v-if="downloadRangeType === downloadRangeTypes.date" class="col-4">
                    <q-input
                        :model-value="dateTextInputModel"
                        :readonly="true"
                        flat
                        label="Date Range"
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

                <template v-else>
                    <q-input
                        v-model="startBlockModel"
                        label="Start Block*"
                        name="export-data-start-block"
                        type="number"
                        color="secondary"
                        required="required"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 q-mr-md"
                    />
                    <q-input
                        v-model="endBlockModel"
                        label="End Block*"
                        name="export-data-end-block"
                        type="number"
                        color="secondary"
                        required="required"
                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                    />
                </template>
            </div>

            <div class="row q-mb-md">
                <div class="col-12">
                    <div id="export-page-captcha"></div>
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
