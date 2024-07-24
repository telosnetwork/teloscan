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

import { createIcon } from '@download/blockies';

const props = defineProps<{ entry: SearchResult }>();
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

const createIconFromData = (data: string) => {
    // https://github.com/download13/blockies
    var imgData = createIcon({
        seed: data,
        size: 8,
        scale: 3,
    }).toDataURL();
    return imgData;
};

const emit = defineEmits(['click']);

const habdleClick = () => {
    emit('click', item);
};

</script>

<template>
<div class="c-search-result" @click="habdleClick">

    <template v-if="category === 'token'">
        <div class='c-search-result-entry c-search-result-entry--token'>
            <img :src="item.token.icon" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">
                    {{ item.token.name }}
                    <span class="c-search-result-entry__title-symbol">({{ item.token.symbol }})</span>
                    <span v-if="item.token.price > 0" class="c-search-result-entry__title-price">{{ item.token.priceUSD }}</span>
                </div>
                <div class="c-search-result-entry__subtitle">{{ item.token.address }}</div>
            </div>
            <q-icon
                v-if="item.token.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            />
        </div>
    </template>

    <template v-if="category === 'contract'">
        <div class='c-search-result-entry c-search-result-entry--contract'>
            <img :src="createIconFromData(item.contract.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.contract.name }}</div>
                <div class="c-search-result-entry__subtitle">{{ item.contract.address }}</div>
            </div>
            <q-icon
                v-if="item.contract.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            />
        </div>
    </template>

    <template v-if="category === 'nft'">
        <div class='c-search-result-entry c-search-result-entry--nft'>
            <img :src="createIconFromData(item.nft.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.nft.name }}</div>
                <div class="c-search-result-entry__subtitle">{{ item.nft.address }}</div>
            </div>
            <q-icon
                v-if="item.nft.verified"
                name="check"
                class="c-search-result-entry__check"
                aria-hidden="true"
            />
        </div>
    </template>

    <template v-if="category === 'address'">
        <div class='c-search-result-entry c-search-result-entry--address'>
            <img :src="createIconFromData(item.address.address)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.address.address }}</div>
                <div v-if="item.address.balance === 'loading'" class="c-search-result-entry__subtitle">
                    <q-skeleton type="text" width="100px" />
                </div>
                <div v-else class="c-search-result-entry__subtitle">{{ item.address.balance }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'transaction'">
        <div class='c-search-result-entry c-search-result-entry--transaction'>
            <img :src="createIconFromData(item.transaction.hash)" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.transaction.hash }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'block'">
        <div class='c-search-result-entry c-search-result-entry--block'>
            <img :src="createIconFromData(item.block.number.toString())" alt="" class="c-search-result-entry__icon">
            <div class="c-search-result-entry__details">
                <div class="c-search-result-entry__title">{{ item.block.number }}</div>
            </div>
        </div>
    </template>

    <template v-if="category === 'unknown'">
        <div class='c-search-result-entry c-search-result-entry--unknown'>
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
        &:hover {
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
