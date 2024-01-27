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
import { contractManager, indexerApi } from 'src/boot/telosApi';
import { ZERO_ADDRESSES } from 'src/lib/utils';
import { addEmptyContractToCache } from 'src/lib/contract-utils';
import { formatTimestamp } from 'src/lib/date-utils';
import { formatWei } from 'src/lib/utils';

import { EvmTransaction, EvmTransfer } from 'src/antelope/types/EvmTransaction';

import AddressInput from 'src/components/inputs/AddressInput.vue';

declare const hcaptcha: {
    /* eslint-disable-next-line no-unused-vars */
    render: (id: string, options: { sitekey: string; theme: string; callback: string }) => void;
};

const TELOSCAN_HCAPTCHA_SITEKEY = '885ed0ce-c4ed-439e-a7c0-1ad3b3727f5b';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

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
    accountInputRef.value?.resetValidation();
    startBlockModel.value = '';
    endBlockModel.value = '';
    dateRange.value = { to: '', from: '' };
}

function escapeCSVValue(value: string) {
    let escapedVal = value;

    if (escapedVal.includes(',') || escapedVal.includes('\n') || escapedVal.includes('"')) {
        escapedVal = `"${escapedVal.replace(/"/g, '""')}"`; // Escape quotes
    }

    return value;
}

async function download() {
    exportIsLoading.value = true;

    let csvContent = '';
    let fileName = '';

    function appendFilters(url: string, extras?: string) {
        let returnUrl = `${url}?limit=${RESULTS_LIMIT}${extras ? `&${extras}` : ''}&`;
        if (dateRange.value.from && dateRange.value.to) {
            const startTime = (new Date(dateRange.value.from)).getTime();
            const endTime = (new Date(dateRange.value.to)).getTime();
            returnUrl += `startDate=${startTime}&endDate=${endTime}`;
        } else {
            returnUrl += `startBlock=${startBlockModel.value}&endBlock=${endBlockModel.value}`;
        }

        return returnUrl;
    }

    if (typeSelectModel.value.value === EXPORT_DOWNLOAD_TYPES.transactions) {
        // eztodo error handling
        let url = `/address/${accountModel.value}/transactions`;
        url = appendFilters(url);

        const { data } = await indexerApi.get(url);
        const { results } = data as { results: EvmTransaction[] };

        const transactionRows = await Promise.all(results.map(async (transaction) => {
            let contract;
            let parsedTransaction;

            if (transaction.input !== '0x' && transaction.to) {
                addEmptyContractToCache(contractManager, data.contracts, transaction);

                contract = await contractManager.getContract(
                    transaction.to,
                );

                if (contract) {
                    try {
                        parsedTransaction = await contractManager.parseContractTransaction(
                            transaction, transaction.input, contract, true,
                        );
                    } catch (e) {
                        parsedTransaction = null;
                    }
                }
            }

            let actionName = '';

            if (
                !parsedTransaction
                && transaction.from === ZERO_ADDRESSES
                && Number(transaction.value) > 0
                && parseInt(transaction.gasPrice) === 0
            ) {
                actionName = $t('components.transaction.deposit');
            } else if (
                !parsedTransaction
                && transaction.to === ZERO_ADDRESSES
                && Number(transaction.value) > 0
                && parseInt(transaction.gasPrice) === 0
            ) {
                actionName = $t('components.transaction.withdraw');
            } else if (!parsedTransaction && transaction.input === '0x' && Number(transaction.value) > 0) {
                actionName = $t('components.transaction.tlos_transfer');
            } else if (!parsedTransaction && transaction.to === null) {
                actionName = $t('components.transaction.contract_deployment');
            } else if (parsedTransaction) {
                actionName = parsedTransaction.name;
            } else {
                actionName = $t('components.transaction.contract_interaction');
            }

            return {
                [$t('components.export.column_header_to')]: `"${transaction.from}"`,
                [$t('components.export.column_header_from')]: `"${transaction.to ?? ''}"`,
                [$t('components.export.column_header_contract_address')]: `"${transaction.contractAddress ?? ''}"`,
                [$t('components.export.column_header_block_number')]: `"${String(transaction.blockNumber)}"`,
                [$t('components.export.column_header_tx_hash')]: `"${transaction.hash}"`,
                [$t('components.export.column_header_timestamp')]: `"${String(transaction.timestamp)}"`,
                [$t('components.export.column_header_date')]: `"${formatTimestamp(transaction.timestamp)}"`,
                [$t('components.export.column_header_action')]: `"${actionName}"`,
            };
        }));

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_contract_address'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_action'),
        ];
        csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';

        transactionRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += row.join(',') + '\r\n';
        });

        fileName = `teloscan-txs-${accountModel.value}.csv`;
    } else if (typeSelectModel.value.value === EXPORT_DOWNLOAD_TYPES.erc20Transfers) {
        let url = `/account/${accountModel.value}/transfers`;
        url = appendFilters(url, 'type=erc20');

        const { data } = await indexerApi.get(url);
        const { results } = data as { results: EvmTransfer[] };

        const transferRows = await Promise.all(results.map(async (transfer) => {
            const contract = await contractManager.getContract(
                transfer.contract,
            );
            const amount = formatWei(transfer.amount, contract.properties.decimals);

            return {
                [$t('components.export.column_header_to')]: `"${transfer.from}"`,
                [$t('components.export.column_header_from')]: `"${transfer.to}"`,
                [$t('components.export.column_header_block_number')]: `"${String(transfer.blockNumber)}"`,
                [$t('components.export.column_header_tx_hash')]: `"${transfer.transaction}"`,
                [$t('components.export.column_header_timestamp')]: `"${String(transfer.timestamp)}"`,
                [$t('components.export.column_header_date')]: `"${formatTimestamp(transfer.timestamp)}"`,
                [$t('components.export.column_header_amount')]: `"${amount}"`,
                [$t('components.export.column_header_token_name')]: `"${contract.properties.name}"`,
                [$t('components.export.column_header_token_symbol')]: `"${contract.properties.symbol}"`,
                [$t('components.export.column_header_token_contract_address')]: `"${transfer.contract}"`,
            };
        }));

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_amount'),
            $t('components.export.column_header_token_name'),
            $t('components.export.column_header_token_symbol'),
            $t('components.export.column_header_token_contract_address'),
        ];
        csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';

        transferRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += row.join(',') + '\r\n';
        });

        fileName = `teloscan-erc20-transfers-${accountModel.value}.csv`;
    } else {
        let url = `/account/${accountModel.value}/transfers`;
        let type;

        if (typeSelectModel.value.value === EXPORT_DOWNLOAD_TYPES.erc721Transfers) {
            type = 'erc721';
            fileName = `teloscan-erc721-transfers-${accountModel.value}.csv`;

        } else {
            type = 'erc1155';
            fileName = `teloscan-erc1155-transfers-${accountModel.value}.csv`;
        }

        url = appendFilters(url, `type=${type}`);

        const { data } = await indexerApi.get(url);
        const { results } = data as { results: EvmTransfer[] };

        const transferRows = await Promise.all(results.map(async (transfer) => {
            const contract = await contractManager.getContract(
                transfer.contract,
            );
            const amount = typeSelectModel.value.value === EXPORT_DOWNLOAD_TYPES.erc721Transfers ? '1' : transfer.amount;

            return {
                [$t('components.export.column_header_to')]: `"${transfer.from}"`,
                [$t('components.export.column_header_from')]: `"${transfer.to}"`,
                [$t('components.export.column_header_block_number')]: `"${String(transfer.blockNumber)}"`,
                [$t('components.export.column_header_tx_hash')]: `"${transfer.transaction}"`,
                [$t('components.export.column_header_timestamp')]: `"${String(transfer.timestamp)}"`,
                [$t('components.export.column_header_date')]: `"${formatTimestamp(transfer.timestamp)}"`,
                [$t('components.export.column_header_amount')]: `"${amount}"`,
                [$t('components.export.column_header_nft_collection_name')]: `"${contract.properties.name}"`,
                [$t('components.export.column_header_nft_id')]: `"${transfer.id}"`,
                [$t('components.export.column_header_token_contract_address')]: `"${transfer.contract}"`,
            };
        }));

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_amount'),
            $t('components.export.column_header_nft_collection_name'),
            $t('components.export.column_header_nft_id'),
            $t('components.export.column_header_token_contract_address'),
        ];
        csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';

        transferRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += row.join(',') + '\r\n';
        });
    }

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a Download Link
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', fileName);

    // Trigger the Download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    exportIsLoading.value = false;
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
                        :label="$t('components.export.column_header_block_number')"
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
