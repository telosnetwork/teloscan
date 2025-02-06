<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { BigNumber } from 'ethers';

import { EvmLog, EvmLogs  } from 'src/core/types/EvmLog';
import AddressField from 'components/AddressField.vue';
import ValueField from 'components/ValueField.vue';
import { ERC721Transfer, ERC1155Transfer, ERC20Transfer, TokenBasicData } from 'src/types';

import { TRANSFER_SIGNATURES } from 'src/core/types';
import { useChainStore } from 'src/core';

const $q = useQuasar();
const { t: $t } = useI18n();

const props = defineProps({
    logs: {
        type: Array as PropType<EvmLogs>,
        required: false,
        default: () => [],
    },
    type: {
        type: String,
        required: false,
        default: 'erc20',
    },
    highlightAddress: {
        type: String,
        required: false,
        default: '',
    },
});

const emit = defineEmits(['highlight', 'transfers-count']);

const erc721_transfers  = ref<ERC721Transfer[]>([]);
const erc1155_transfers = ref<ERC1155Transfer[]>([]);
const erc20_transfers   = ref<ERC20Transfer[]>([]);

const resetTransfers = () => {
    erc721_transfers.value = [];
    erc1155_transfers.value = [];
    erc20_transfers.value = [];
};

const processLog = async (log: EvmLog): Promise<ERC20Transfer | ERC721Transfer | ERC1155Transfer | null> => {
    const contractManager = useChainStore().currentChain.settings.getContractManager();

    let sig = log.topics[0].substring(0, 10);
    if (TRANSFER_SIGNATURES.includes(sig)) {
        let type = contractManager.getTokenTypeFromLog(log);
        let contract = await contractManager.getContract(log.address, type);
        if (typeof contract.properties !== 'undefined' && contract.properties !== null) {
            let token: TokenBasicData = {
                'symbol': contract.properties.symbol,
                'address': log.address,
                'name': contract.properties.name,
                'decimals': contract.properties.decimals,
            };
            if (type === 'erc721') {
                let tokenId = BigNumber.from(log.topics[3]).toString();
                if (contract.token.extensions?.metadata) {
                    try {
                        token = await contractManager.loadTokenMetadata(
                            log.address,
                            contract.token,
                            tokenId,
                        );
                    } catch (e: any) {
                        console.error(`Could not retreive metadata for ${contract.address}: ${e.message}`);
                        // notify the user
                        $q.notify({
                            message: $t(
                                'pages.couldnt_retreive_metadata_for_address',
                                { address: contract.address, message: e.message },
                            ),
                            color: 'negative',
                            position: 'top',
                            timeout: 5000,
                        });
                    }
                }
                return {
                    'tokenId': tokenId,
                    'to': '0x' + log.topics[2].substring(log.topics[2].length - 40, 40),
                    'from': '0x' + log.topics[1].substring(log.topics[1].length - 40, 40),
                    'token': token,
                } as ERC721Transfer;
            } else if (type === 'erc1155') {
                let tokenId = BigNumber.from(log.data.substring(0, 66)).toString();
                if (contract.token.extensions?.metadata) {
                    try {
                        token = await contractManager.loadTokenMetadata(
                            log.address,
                            contract.token,
                            tokenId,
                        );
                    } catch (e: any) {
                        console.error(`Could not retreive metadata for ${contract.address}: ${e.message}`);
                        // notify the user
                        $q.notify({
                            message: $t(
                                'pages.couldnt_retreive_metadata_for_address',
                                { address: contract.address, message: e.message },
                            ),
                            color: 'negative',
                            position: 'top',
                            timeout: 5000,
                        });
                    }
                }
                return {
                    'tokenId': tokenId,
                    'amount': BigNumber.from(log.data).toString(),
                    'to': '0x' + log.topics[3].substring(log.topics[3].length - 40, 40),
                    'from': '0x' + log.topics[2].substring(log.topics[2].length - 40, 40),
                    'token': token,
                } as ERC1155Transfer;
            } else {
                return {
                    'value': log.data,
                    'wei': BigNumber.from(log.data).toString(),
                    'from': '0x' + log.topics[1].substring(log.topics[1].length - 40),
                    'to': '0x' + log.topics[2].substring(log.topics[2].length - 40),
                    'token': token,
                } as ERC20Transfer;
            }
        }
    }

    return null;
};

const loadTransfers = async () => {
    if (!props.logs || props.logs.length === 0) {
        emit('transfers-count', 0);
        return;
    }

    const logs = props.logs as EvmLogs;
    const promises = [];
    for (const log of logs) {
        promises.push(processLog(log));
    }

    const transfers = await Promise.all(promises);
    resetTransfers();
    for (const transfer of transfers) {
        if (transfer) {
            if ('amount' in transfer) {
                erc1155_transfers.value.push(transfer as ERC1155Transfer);
            } else if ('tokenId' in transfer) {
                erc721_transfers.value.push(transfer as ERC721Transfer);
            } else if ('value' in transfer) {
                erc20_transfers.value.push(transfer as ERC20Transfer);
            } else {
                console.error('Unknown transfer type', transfer);
            }
        }
    }
    const count = erc20_transfers.value.length + erc721_transfers.value.length + erc1155_transfers.value.length;
    emit('transfers-count', count);
};

watch(() => props.logs, async (newTrx) => {
    if (newTrx) {
        await loadTransfers();
    }
}, { immediate: true });


</script>


<template>
<div class="c-erc-transfers">
    <div
        v-for="(transfer, index) in erc20_transfers"
        :key="index"
        class="c-erc-transfers__row"
    >
        <q-icon class="c-erc-transfers__icon list-arrow" name="arrow_right"/>
        <div class="c-erc-transfers__cell c-erc-transfers__cell--a">
            <strong> {{ $t('components.transaction.from') }} </strong>
            <AddressField
                copy
                :address="transfer.from"
                :truncate="15"
            />
        </div>
        <div class="c-erc-transfers__cell c-erc-transfers__cell--b">
            <strong>{{ $t('components.transaction.to') }}</strong>
            <AddressField
                copy
                :address="transfer.to"
                :truncate="15"
            />
        </div>
        <div class="c-erc-transfers__cell c-erc-transfers__cell--c">
            <strong>{{ $t('components.nfts.amount') }}</strong>
            <ValueField
                :value="transfer.value"
                :decimals="transfer.token.decimals"
            />
            <AddressField
                :address="transfer.token.address"
                :truncate="15"
            />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-erc-transfers {
    max-height: 200px;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    @include scroll-bar;

    &__row {
        grid-template-rows: auto;
        grid-auto-columns: 19px 1fr;
        grid-template:
            'icon a'
            'icon b'
            'icon c';
        display: grid;

        & + & {
            margin-top: 10px;
        }
    }

    &__icon {
        grid-area: icon;
    }
    &__cell {
        display: flex;
        gap: 5px;
        &--a {
            grid-area: a;
        }
        &--b {
            grid-area: b;
        }
        &--c {
            grid-area: c;
        }
    }

    @media screen and (min-width: $breakpoint-sm-min) {
        display: flex;
        flex-direction: column;
        gap: 5px;
        overflow-x: hidden;
        &__row {
            display: flex;
            gap: 5px;
            align-items: baseline;
        }
        &__cell {
            display: flex;
            gap: 5px;
            align-items: flex-start;
        }
    }
}

</style>
