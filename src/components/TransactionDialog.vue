<script lang="ts" setup>
import { computed, ref } from 'vue';
import { BigNumber } from 'ethers/lib/ethers';
import { useI18n } from 'vue-i18n';

import { truncateAddress } from 'src/core/wallets/utils/text-utils';
import { WEI_PRECISION, ZERO_ADDRESSES, formatWei } from 'src/lib/utils';

import OutlineButton from 'src/components/OutlineButton.vue';
import { useChainStore } from 'src/core';

const $i18n = useI18n();
const $t = $i18n.t;
const locale = $i18n.locale.value;

const props = defineProps({
    trx: {
        type: Object,
        default: null,
    },
});

const menuOpen = ref(false);

const actionText = computed(() => {
    if (
        !props.trx.parsedTransaction
        && props.trx.from === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        return $t('pages.transactions.deposit_native');
    }
    if (
        !props.trx.parsedTransaction
        && props.trx.to === ZERO_ADDRESSES
        && props.trx.value
        && parseInt(props.trx.gasPrice as string) === 0
    ) {
        return $t('pages.transactions.withdraw_native');
    }

    if (!props.trx.parsedTransaction && props.trx.to === null && props.trx.data !== null) {
        return $t('pages.transactions.contract_deployment');
    }

    if (props.trx.parsedTransaction) {
        return props.trx.parsedTransaction.name;
    }

    if (!props.trx.parsedTransaction && props.trx.input === '0x' && props.trx.value) {
        // action is a transfer; handle separately in the template
        return '';
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
    const wei = BigNumber.from(props.trx.gasUsed ?? props.trx.gasused).mul(props.trx.gasPrice);
    return formatWei(wei, 18, 4);
});

function formatTlos(value: string) {
    return formatWei(value, WEI_PRECISION, 4);
}
</script>

<template>
<div>
    <OutlineButton :icon-only="true" :highlight="menuOpen" text-color="primary">
        <q-icon name="far fa-eye" size="12px" />
        <q-menu
            anchor="top right"
            self="top left"
            @update:model-value="menuOpen = $event"
        >
            <q-card>
                <q-card-section>
                    <div>
                        <strong>{{ $t('pages.transactions.status_label') }}:</strong>
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
                        <strong>{{ $t('pages.transactions.transaction_action_label') }}:</strong>
                        <p>
                            <template v-if="actionText">{{ actionText }}</template>
                            <template v-else>
                                {{
                                    $t(
                                        'pages.transactions.transfer_for_x_tlos_from',
                                        { amount: formatTlos(trx.value) }
                                    )
                                }}
                                <router-link :to="`/address/${trx.from}`">
                                    {{ truncateAddress(trx.from) }}
                                </router-link>
                                {{  $t('pages.transactions.to')}}
                                <router-link :to="`/address/${trx.to}`">
                                    {{ truncateAddress(trx.to) }}
                                </router-link>
                            </template>
                        </p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.transactions.transaction_fee_label') }}:</strong>
                        <p>{{ totalGasFee }} {{ useChainStore().currentChain.settings.getSystemToken().symbol }}</p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.transactions.gas_info_label') }}:</strong>
                        <p>
                            {{
                                $t(
                                    'pages.transactions.x_gas_used_of_y_limit',
                                    {
                                        amount: gasUsed,
                                        limit: gasLimit,
                                    }
                                )
                            }}
                        </p>
                    </div>
                    <div>
                        <strong>{{ $t('pages.transactions.nonce_label') }}:</strong>
                        <p>{{ trx.nonce }}</p>
                    </div>
                    <div>
                        <p>
                            <router-link :key="$route.path" :to="`/tx/${trx.hash}`">
                                {{ $t('pages.transactions.see_more_details') }}
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
