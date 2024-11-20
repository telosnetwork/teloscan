<script setup lang="ts">
import { defineProps } from 'vue';
import {
    SearchResult,
    SearchResultContract,
    SearchResultToken,
    SearchResultNFT,
    SearchResultAddress,
    SearchResultTrx,
    SearchResultBlock,
    SearchResultUnknown,
} from 'src/types';

import { computed } from 'vue';
import { createIconFromData } from 'src/lib/blockies/blockies';

const props = defineProps<{
    entry: SearchResult,
    selected: boolean,
}>();

const selected_class = computed(() => props.selected ? 'c-search-result-entry--selected' : '');
const category = props.entry.category;

const asToken = (entry: SearchResult): SearchResultToken => entry as SearchResultToken;
const asContract = (entry: SearchResult): SearchResultContract => entry as SearchResultContract;
const asNFT = (entry: SearchResult): SearchResultNFT => entry as SearchResultNFT;
const asAddress = (entry: SearchResult): SearchResultAddress => entry as SearchResultAddress;
const asTrx = (entry: SearchResult): SearchResultTrx => entry as SearchResultTrx;
const asBlock = (entry: SearchResult): SearchResultBlock => entry as SearchResultBlock;
const asUnknown = (entry: SearchResult): SearchResultUnknown => entry as SearchResultUnknown;

const item = {
    token: asToken(props.entry),
    contract: asContract(props.entry),
    nft: asNFT(props.entry),
    address: asAddress(props.entry),
    transaction: asTrx(props.entry),
    block: asBlock(props.entry),
    unknown: asUnknown(props.entry),
};



const emit = defineEmits(['click']);

const habdleClick = () => {
    emit('click', item);
};

</script>

<template>
<div @click="habdleClick">

    <template v-if="category === 'token'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--token', selected_class]">
            <img :src="item.token.icon" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div v-if="item.token.name && item.token.name !== 'null'" class="c-search-result-entry__title">
                    {{ item.token.name }}
                    <span v-if="item.token.symbol && item.token.symbol != 'null'" class="c-search-result-entry__title-symbol">({{ item.token.symbol }})</span>
                    <span v-if="item.token.price > 0" class="c-search-result-entry__title-price">{{ item.token.priceUSD }}</span>
                </div>
                <div class="c-search-result-entry__subtitle">{{ item.token.address }}</div>
            </div>
            <q-icon
                v-if="item.token.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            >
                <q-tooltip>{{ $t('components.contract_tab.verified_contract')}}</q-tooltip>
            </q-icon>
        </div>
    </template>

    <template v-if="category === 'contract'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--contract', selected_class]">
            <img :src="createIconFromData(item.contract.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div v-if="item.contract.name && item.contract.name !== 'null'" class="c-search-result-entry__title">
                    {{ item.contract.name }}
                </div>
                <div class="c-search-result-entry__subtitle">{{ item.contract.address }}</div>
            </div>
            <q-icon
                v-if="item.contract.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            >
                <q-tooltip>{{ $t('components.contract_tab.verified_contract')}}</q-tooltip>
            </q-icon>
        </div>
    </template>

    <template v-if="category === 'nft'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--nft', selected_class]">
            <img :src="createIconFromData(item.nft.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div v-if="item.nft.name && item.nft.name !== 'null'" class="c-search-result-entry__title">
                    {{ item.nft.name }}
                    <span v-if="item.nft.nftType" class="c-search-result-entry__title-nftType"> - {{ item.nft.nftType }}</span>
                    <span v-if="item.nft.symbol && item.nft.symbol !== 'null'" class="c-search-result-entry__title-symbol">({{ item.nft.symbol }})</span>
                </div>
                <div class="c-search-result-entry__subtitle">{{ item.nft.address }}</div>
            </div>
            <q-icon
                v-if="item.nft.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            >
                <q-tooltip>{{ $t('components.contract_tab.verified_contract')}}</q-tooltip>
            </q-icon>
        </div>
    </template>

    <template v-if="category === 'address'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--address', selected_class]">
            <img :src="createIconFromData(item.address.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.address.address }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'transaction'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--transaction', selected_class]">
            <img :src="createIconFromData(item.transaction.hash)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.transaction.hash }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'block'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--block', selected_class]">
            <img :src="createIconFromData(item.block.number.toString())" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.block.number }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'unknown'">
        <div :class="['c-search-result-entry', 'c-search-result-entry--unknown', selected_class]">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">Unknown</div>
            </div>
        </div>
    </template>

</div>
</template>

<style lang="scss">


.c-search-result {
    padding: 0px 10px;
    width: 100%;
    &-entry {
        width: 100%;
        padding: 8px;
        cursor: pointer;
        display: flex;
        border-radius: 8px;
        &--selected, &:hover {
            background-color: var(--bg-hover-color);
        }
        &__details {
            width: calc(100% - 50px);
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
        }
        &__title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: .9062rem;
            font-weight: 400;
            &-symbol {
                color: var(--subtitle-color);
                margin-left: 5px;
            }
            &-price {
                font-weight: 600;
                color: var(--subtitle-color);
                margin-left: 10px;
            }
            &-nftType {
                font-weight: 400;
                color: var(--subtitle-color);
                margin-right: 5px;
            }
            &-muted {
                font-weight: 400;
                font-size: .875em;
                color: var(--muted-text-color);
                margin-left: 5px;
            }
        }
        &__subtitle {
            font-size: 16px;
            font-size: .875em;
            color: var(--subtitle-color);
            // elipsis
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        &__icon {
            width: 22px;
            height: 22px;
            margin-right: 10px;
            border-radius: 50%;
        }
        &__check {
            font-size: 24px;
            color: green;
        }
    }
}
</style>
