<script lang="ts" setup>
import { computed } from 'vue';
import { BigNumber } from 'ethers/lib/ethers';
import { useI18n } from 'vue-i18n';

import { truncateAddress } from 'src/antelope/wallets/utils/text-utils';
import { WEI_PRECISION, ZERO_ADDRESSES, formatWei } from 'src/lib/utils';

import OutlineButton from 'src/components/OutlineButton.vue';


const locale = useI18n().locale.value;

const props = defineProps({
    trx: {
        type: Object,
        default: null,
    },
});

const actionText = computed(() => {
    if (
        !props.trx.parsedTransaction
        && props.trx.from === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        return 'deposit (native)'; // eztodo i18n
    }
    if (
        !props.trx.parsedTransaction
        && props.trx.to === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        return 'withdraw (native)'; // eztodo i18n
    }

    if (!props.trx.parsedTransaction && props.trx.to === null && props.trx.data !== null) {
        return 'Contract Deployment'; // eztodo i18n
    }

    if (props.trx.parsedTransaction) {
        return props.trx.parsedTransaction.name;
    }

    if (!props.trx.parsedTransaction && props.trx.input === '0x' && props.trx.value) {
        // action is a transfer; handle separately in the template
        return ''; // eztodo i18n
    }

    return props.trx.input.slice(0, 10);
});
const gasLimit = computed(() => {
    const gas = BigNumber.from(props.trx.gasLimit);

    try {
        return gas.toNumber().toLocaleString(locale);
    } catch (e) {
        console.error(e);
        return gas.toString();
    }
});
const gasUsed = computed(() => {
    const gas = BigNumber.from(props.trx.gasUsed ?? props.trx.gasused);
    try {
        return gas.toNumber().toLocaleString(locale);
    } catch (e) {
        console.error(e);
        return gas.toString();
    }
});
const totalGasFee = computed(() => {
    const wei = BigNumber.from(props.trx.gasUsed).mul(props.trx.gasPrice);
    return formatWei(wei, 18, 4);
});

function formatTlos(value: string) {
    return formatWei(value, WEI_PRECISION, 4);
}
</script>

<template>
<!-- eztodo i18n -->
<div class="transaction-summary">
    <OutlineButton :icon-only="true" text-color="primary">
        <q-icon name="far fa-eye" size="12px" />
        <q-menu
            anchor="top right"
            self="top left"
        >
            <q-card>
                <q-card-section>
                    <div>
                        <strong>Status: </strong>
                        <p>
                            <span v-if="trx.status == 1" class="u-flex--center-y">
                                <q-icon name="check" color="positive" class="q-mr-xs"/>
                                <span class="text-positive">{{ $t('pages.success') }}</span>
                            </span>
                            <span v-else class="u-flex--center-y">
                                <q-icon name="warning" color="negative" class="q-mr-xs"/>
                                <span class="text-negative">{{ $t('pages.failure') }}</span>
                            </span>
                        </p>
                    </div>
                    <div>
                        <strong>Transaction Action:</strong>
                        <p>
                            <span v-if="actionText">{{ actionText }}</span>
                            <template v-else>
                                Transfer for {{ formatTlos(trx.value) }} TLOS from     <router-link
                                    :to="`/address/${trx.from}`"
                                > {{ truncateAddress(trx.from) }}</router-link> to <router-link
                                    :to="`/address/${trx.to}`"
                                > {{ truncateAddress(trx.to) }}</router-link>
                            </template>
                        </p>
                    </div>
                    <div>
                        <strong>Transaction Fee:</strong>
                        <p>{{ totalGasFee }} TLOS </p>
                    </div>
                    <div>
                        <strong>Gas Info:</strong>
                        <p>{{ gasUsed }} gas used from {{ gasLimit }} limit</p>
                    </div>
                    <div>
                        <strong>Nonce:</strong>
                        <p>{{ trx.nonce }}</p>
                    </div>
                    <div>
                        <p>
                            <router-link :key="$route.path" :to="`/tx/${trx.hash}`">
                                See more details
                            </router-link>
                        </p>
                    </div>
                </q-card-section>
            </q-card>
        </q-menu>
    </OutlineButton>
</div>
</template>

<style lang="scss">
</style>
