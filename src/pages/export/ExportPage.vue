<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
    nextTick,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';
import { parseAddressString } from 'src/lib/function-interface-utils';
import { downloadCsv } from 'src/lib/data-export-utils';

import { useNotifications } from 'src/boot/errorHandling';

import AddressInput from 'src/components/inputs/AddressInput.vue';

declare const hcaptcha: {
    // eslint-disable-next-line no-unused-vars
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
// Maximum allowed ranges (same as in server validations)
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ONE_YEAR_BLOCKS = 63072000;

// data
const accountModel = ref('');
const accountInputRef = ref<null | typeof AddressInput>(null);
const typeSelectModel = ref(exportTypes[0]);
const downloadRangeType = ref(downloadRangeTypes.date);
const startDateModel = ref('');
const endDateModel = ref('');
const startBlockModel = ref('');
const endBlockModel = ref('');
const captchaSucceeded = ref(false);
const captchaToken = ref('');
const exportIsLoading = ref(false);

// computed
const dateRange = computed(() => ({
    from: startDateModel.value,
    to: endDateModel.value,
}));

// Check if string is a valid number
const isNumber = (val: string) => /^\d+$/.test(val);
const addressIsValid = computed(() => !!parseAddressString(accountModel.value));

// Updated date range validation: complete, in order, and less than or equal to one year
const dateRangeIsValid = computed(() => {
    if (!startDateModel.value || !endDateModel.value) {
        return false;
    }
    if (startDateModel.value > endDateModel.value) {
        return false;
    }
    const start = new Date(startDateModel.value);
    const end = new Date(endDateModel.value);
    return (end.getTime() - start.getTime()) <= ONE_YEAR_MS;
});

// Updated block range validation: complete, in order, and less than or equal to one year of blocks
const blockRangeIsValid = computed(() => {
    if (!isNumber(startBlockModel.value) || !isNumber(endBlockModel.value)) {
        return false;
    }
    const start = parseInt(startBlockModel.value);
    const end = parseInt(endBlockModel.value);
    if (start > end) {
        return false;
    }
    return (end - start) <= ONE_YEAR_BLOCKS;
});

// Computed property to show detailed range error messages
const rangeErrorMessage = computed(() => {
    if (downloadRangeType.value === downloadRangeTypes.date) {
        if (!startDateModel.value || !endDateModel.value) {
            return '';
        }
        if (startDateModel.value > endDateModel.value) {
            return $t('components.export.invalid_date_range');
        }
        const start = new Date(startDateModel.value);
        const end = new Date(endDateModel.value);
        if ((end.getTime() - start.getTime()) > ONE_YEAR_MS) {
            return $t('components.export.date_range_exceeds_limit');
        }
    } else if (downloadRangeType.value === downloadRangeTypes.block) {
        if (!startBlockModel.value || !endBlockModel.value) {
            return '';
        }
        const start = parseInt(startBlockModel.value);
        const end = parseInt(endBlockModel.value);
        if (start > end) {
            return $t('components.export.invalid_block_range');
        }
        if ((end - start) > ONE_YEAR_BLOCKS) {
            return $t('components.export.block_range_exceeds_limit', { limit: ONE_YEAR_BLOCKS.toLocaleString() });
        }
    }
    return '';
});

const enableDownloadButton = computed(() =>
    addressIsValid.value &&
    captchaSucceeded.value &&
    (
        (downloadRangeType.value === downloadRangeTypes.date && dateRangeIsValid.value) ||
        (downloadRangeType.value === downloadRangeTypes.block && blockRangeIsValid.value)
    ),
);

// For text input binding with date values
const startDateTextInputModel = computed(() => startDateModel.value);
const endDateTextInputModel = computed(() => endDateModel.value);

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

// methods
function resetOptions() {
    accountModel.value = '';
    typeSelectModel.value = exportTypes[0];
    startBlockModel.value = '';
    endBlockModel.value = '';

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
        captchaToken.value,
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

function hCaptchaSuccessHandler(token: string) {
    captchaToken.value = token;
    captchaSucceeded.value = true;
}

onMounted(() => {
    // hCaptcha requires these global functions
    window.teloscanHCaptchaSuccessHandler = hCaptchaSuccessHandler;
    window.teloscanHCaptchaLoadHandler = hCaptchaLoadHandler;

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
    delete window.teloscanHCaptchaSuccessHandler;
    delete window.teloscanHCaptchaLoadHandler;
});
</script>

<template>
<div class='c-export-page'>
    <div class='c-export-page__header'>
        <h1 class='c-export-page__header-title'>
            {{ $t('components.export.page_header') }}
        </h1>
    </div>

    <q-card class='c-export-page__content'>
        <form>
            <div class='c-export-page__container'>
                <div class='c-export-page__row c-export-page__row--break'>
                    <div class='c-export-page__col'>
                        <div class='c-export-page__row c-export-page__value-container'>
                            <q-select
                                v-model='typeSelectModel'
                                :options='exportTypes'
                                color='primary'
                                class='c-export-page__value'
                                :label='$t("components.export.export_type")'
                            />
                        </div>
                        <div class='c-export-page__row c-export-page__value-container'>
                            <AddressInput
                                ref='accountInputRef'
                                v-model='accountModel'
                                :label='$t("pages.account")'
                                class='c-export-page__value'
                                required='required'
                                name='export-account'
                            />
                        </div>
                    </div>
                    <div class='c-export-page__col'>
                        <div class='c-export-page__row c-export-page__value-container'>
                            <div class='c-export-page__value'>
                                {{ $t('components.export.choose_download_option') }}
                                <br>
                                <q-radio
                                    v-model='downloadRangeType'
                                    :val='downloadRangeTypes.date'
                                    :label='$t("components.export.date_range")'
                                    color='primary'
                                />
                                <q-radio
                                    v-model='downloadRangeType'
                                    :val='downloadRangeTypes.block'
                                    :label='$t("components.export.block_range")'
                                    color='primary'
                                />
                            </div>
                        </div>
                        <!-- Display range error message if any -->
                        <div
                            v-if='rangeErrorMessage'
                            class='c-export-page__row c-export-page__invalid-range'
                        >
                            {{ rangeErrorMessage }}
                        </div>
                        <div
                            v-if='downloadRangeType === downloadRangeTypes.date'
                            :class='{
                                "c-export-page__row": true,
                                "c-export-page__value-container": true,
                                "c-export-page__value-container--error": rangeErrorMessage !== ""
                            }'
                        >
                            <q-input
                                v-model='startDateTextInputModel'
                                :label='`${$t("components.export.start_date")}*`'
                                name='export-data-start-date'
                                type='text'
                                :color="rangeErrorMessage !== '' ? 'negative' : 'primary'"
                                required='required'
                                class='c-export-page__value'
                                error-message='Invalid date range'
                            >
                                <template v-slot:append>
                                    <q-icon name='event' class='cursor-pointer'>
                                        <q-popup-proxy cover transition-show='scale' transition-hide='scale'>
                                            <q-date
                                                v-model='startDateModel'
                                                minimal
                                                color='primary'
                                            >
                                                <div class='row items-center justify-end'>
                                                    <q-btn
                                                        v-close-popup
                                                        :label='$t("global.close")'
                                                        color='primary'
                                                        flat
                                                    />
                                                </div>
                                            </q-date>
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                            <q-input
                                v-model='endDateTextInputModel'
                                :label='`${$t("components.export.end_date")}*`'
                                name='export-data-end-date'
                                type='text'
                                :color="rangeErrorMessage !== '' ? 'negative' : 'primary'"
                                required='required'
                                class='c-export-page__value'
                            >
                                <template v-slot:append>
                                    <q-icon name='event' class='cursor-pointer'>
                                        <q-popup-proxy cover transition-show='scale' transition-hide='scale'>
                                            <q-date
                                                v-model='endDateModel'
                                                minimal
                                                color='primary'
                                            >
                                                <div class='row items-center justify-end'>
                                                    <q-btn
                                                        v-close-popup
                                                        :label='$t("global.close")'
                                                        color='primary'
                                                        flat
                                                    />
                                                </div>
                                            </q-date>
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                        </div>

                        <div
                            v-else
                            :class='{
                                "c-export-page__row": true,
                                "c-export-page__value-container": true,
                                "c-export-page__value-container--error": rangeErrorMessage !== ""
                            }'
                        >
                            <q-input
                                v-model='startBlockModel'
                                :label='`${$t("components.export.start_block")}*`'
                                name='export-data-start-block'
                                type='number'
                                :color="rangeErrorMessage !== '' ? 'negative' : 'primary'"
                                required='required'
                                class='c-export-page__value'
                            />
                            <q-input
                                v-model='endBlockModel'
                                :label='`${$t("components.export.end_block")}*`'
                                name='export-data-end-block'
                                type='number'
                                :color="rangeErrorMessage !== '' ? 'negative' : 'primary'"
                                required='required'
                                class='c-export-page__value'
                            />
                        </div>
                    </div>
                </div>

                <div class='c-export-page__row c-export-page__row--separator'></div>

                <div class='c-export-page__row'>
                    <div class='c-export-page__col c-export-page__value-container'>
                        <div class='c-export-page__value flex items-center c-export-page__limit-notice'>
                            <q-icon name='info' class='q-mr-sm' />
                            {{ $t('components.export.limit_notice', { amount: RESULTS_LIMIT.toLocaleString() }) }}
                        </div>
                    </div>
                </div>

                <div class='c-export-page__row'>
                    <div class='c-export-page__col c-export-page__value-container'>
                        <div class='c-export-page__value c-export-page__captcha-container'>
                            <q-spinner class='c-export-page__captcha-spinner' size='md' aria-hidden='true' />
                            <div id='export-page-captcha' class='c-export-page__captcha'></div>
                        </div>
                    </div>
                </div>

                <div class='c-export-page__row'>
                    <div class='c-export-page__buttons c-export-page__value-container'>
                        <q-btn
                            :disable='!enableDownloadButton'
                            :label='$t("components.export.download_csv")'
                            :loading='exportIsLoading'
                            icon='download'
                            color='primary'
                            class='c-export-page__btn'
                            @click='download'
                        />
                        <q-btn
                            :label='$t("components.export.reset")'
                            flat
                            class='c-export-page__btn'
                            color='primary'
                            @click='resetOptions'
                        />
                    </div>
                </div>
            </div>
        </form>
    </q-card>
</div>
</template>

<style lang="scss">
.c-export-page {
    @include page-container;

    &__header {
        @include page-header;
    }

    &__header-title {
        margin: 0;
        line-height: 1.5;
    }

    &__content {
        width: 100%;
        padding: 0px 250px;
        @media (max-width: 1245px) {
            padding: 0px calc(36vw - 200px);
        }
        @media (max-width: 768px) {
            padding: 0px;
        }
    }

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
        z-index: 5;
    }

    &__limit-notice {
        color: var(--grey-text-color);
    }

    &__row {
        display: flex;
        flex-direction: row;
        gap: 16px;
        &--separator {
            display: none;
        }
        &--break {
            flex-direction: column;
        }
    }

    &__invalid-range {
        justify-content: center;
        color: var(--q-negative);
        margin-top: 16px;
    }

    &__col {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    &__value {
        width: 100%;
    }

    &__buttons {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
        gap: 16px;
    }

    &__value-container {
        padding: 16px;
        &--error {
            border: 1px solid var(--q-negative);
            border-radius: 4px;
        }
    }
}
</style>
