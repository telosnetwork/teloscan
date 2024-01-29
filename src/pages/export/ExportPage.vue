<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';
import { parseAddressString } from 'src/lib/function-interface-utils';
import { downloadCsv } from 'src/lib/data-export-utils';

import { useNotifications } from 'src/boot/errorHandling';

import AddressInput from 'src/components/inputs/AddressInput.vue';
import { nextTick } from 'vue';

declare const hcaptcha: {
    /* eslint-disable-next-line no-unused-vars */
    render: (id: string, options: { sitekey: string; theme: string; callback: string }) => void;
};

const TELOSCAN_HCAPTCHA_SITEKEY = '885ed0ce-c4ed-439e-a7c0-1ad3b3727f5b';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();
const { notifyFailure, notifySuccessMessage } = useNotifications();

const exportTypes = [{
    label: $t('components.export.transactions'),
    value: EXPORT_DOWNLOAD_TYPES.transactions,
}, {
    label: $t('components.export.erc_20_transfers'),
    value: EXPORT_DOWNLOAD_TYPES.erc20Transfers,
}, {
    label: $t('components.export.erc_721_transfers'),
    value: EXPORT_DOWNLOAD_TYPES.erc721Transfers,
}, {
    label: $t('components.export.erc_1155_transfers'),
    value: EXPORT_DOWNLOAD_TYPES.erc1155Transfers,
}];

const downloadRangeTypes = {
    date: 'date',
    block: 'block',
};

const RESULTS_LIMIT = 10000;

// data
const accountModel = ref('');
const accountInputRef = ref<null | typeof AddressInput>(null);
const typeSelectModel = ref(exportTypes[0]);
const downloadRangeType = ref(downloadRangeTypes.date);
const dateRange = ref({ to: '', from: '' });
const startBlockModel = ref('');
const endBlockModel = ref('');
const captchaSucceeded = ref(false);
const exportIsLoading = ref(false);

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
    startBlockModel.value = '';
    endBlockModel.value = '';
    dateRange.value = { to: '', from: '' };

    nextTick(() => {
        accountInputRef.value?.resetValidation();
    });
}

function download() {
    exportIsLoading.value = true;

    const datesArg = downloadRangeType.value === downloadRangeTypes.date
        ? {
            from: dateRange.value.from,
            to: dateRange.value.to,
        }
        : {
            from: null,
            to: null,
        };
    const blockRangeArg = downloadRangeType.value === downloadRangeTypes.block
        ? {
            startBlock: startBlockModel.value,
            endBlock: endBlockModel.value,
        }
        : {
            startBlock: null,
            endBlock: null,
        };

    downloadCsv(
        $t,
        RESULTS_LIMIT,
        typeSelectModel.value.value,
        accountModel.value,
        datesArg,
        blockRangeArg,
    ).then(() => {
        notifySuccessMessage($t('components.export.notification_successful_download'));
    }).catch((e: Error) => {
        notifyFailure($t('components.export.notification_failed_download'), e);
    }).finally(() => {
        exportIsLoading.value = false;
    });
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

onBeforeUnmount(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (window as any).teloscanHCaptchaSuccessHandler;
    delete (window as any).teloscanHCaptchaLoadHandler;
    /* eslint-enable */
});
</script>

<template>
<div class="pageContainer q-pt-lg">
    <h1 class="text-primary text-h4 q-pb-md">
        {{ $t('components.export.page_header') }}
    </h1>

    <q-card>
        <div class="q-pa-lg">
            <div class="row q-mb-md">
                <div class="col-12 col-md-6 col-lg-2">
                    <q-select
                        v-model="typeSelectModel"
                        :options="exportTypes"
                        color="secondary"
                        :label="$t('components.export.export_type')"
                    />
                </div>
            </div>

            <div class="row q-mb-lg">
                <div class="col-12 col-md-6 col-lg-4">
                    <AddressInput
                        ref="accountInputRef"
                        v-model="accountModel"
                        :label="$t('pages.account')"
                        required="required"
                        name="export-account"
                    />
                </div>
            </div>

            <div class="row q-mb-md">
                <div class="col-12">
                    {{ $t('components.export.choose_download_option') }}
                    <br>
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.date"
                        :label="$t('components.export.date_range')"
                        color="secondary"
                    />
                    <q-radio
                        v-model="downloadRangeType"
                        :val="downloadRangeTypes.block"
                        :label="$t('components.export.block_range')"
                        color="secondary"
                    />
                </div>
            </div>

            <div class="row q-mb-md">
                <div v-if="downloadRangeType === downloadRangeTypes.date" class="col-4">
                    <q-input
                        :model-value="dateTextInputModel"
                        :readonly="true"
                        flat
                        :label="$t('components.export.date_range')"
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
                                                :label="$t('global.close')"
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
                        :label="`${$t('components.export.start_block')}*`"
                        name="export-data-start-block"
                        type="number"
                        color="secondary"
                        required="required"
                        class="col-12 col-sm-6 col-md-4 col-lg-3 q-mr-md"
                    />
                    <q-input
                        v-model="endBlockModel"
                        :label="`${$t('components.export.end_block')}*`"
                        name="export-data-end-block"
                        type="number"
                        color="secondary"
                        required="required"
                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                    />
                </template>
            </div>

            <div class="row q-mb-lg">
                <div class="col-12">
                    <div class="flex items-center text-grey">
                        <q-icon name="info" class="q-mr-sm" />
                        {{ $t('components.export.limit_notice', { amount: RESULTS_LIMIT.toLocaleString() }) }}
                    </div>
                </div>
            </div>

            <div class="row q-mb-md">
                <div class="col-12">
                    <div class="c-export-page__captcha-container">
                        <q-spinner class="c-export-page__captcha-spinner" size="md" aria-hidden="true" />

                        <div id="export-page-captcha" class="c-export-page__captcha"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <q-btn
                        :disable="!enableDownloadButton"
                        :label="$t('components.export.download_csv')"
                        :loading="exportIsLoading"
                        icon="download"
                        color="secondary"
                        class="q-mr-md"
                        @click="download"
                    />
                    <q-btn
                        :label="$t('components.export.reset')"
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

<style lang="scss">
.c-export-page {
    &__captcha-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    &__captcha-spinner {
        position: absolute;
        left: 0;
        z-index: 1;
    }

    &__captcha {
        z-index: 5
    }
}
</style>
