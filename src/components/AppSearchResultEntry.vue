<script setup lang="ts">
import { defineProps } from 'vue';
import {
    SearchResult,
    SearchResultCategory,
    SearchResultContract,
    SearchResultToken,
    SearchResultNFT,
    SearchResultAddress,
    SearchResultTrx,
    SearchResultBlock,
    SearchResultUnknown,
} from 'src/types';

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

</script>

<template>
<div class="c-search-result">

    <template v-if="category === 'token'">
        <div :class="['c-search-result__entry-' + entry.category]">
            <img :src="item.token.icon" alt="" class="c-search-result__icon">
            <div class="c-search-result__details">
                <div class="c-search-result__title">
                    {{ item.token.name }}
                    <span v-if="item.token.price > 0" class="c-search-result__title-price">{{ item.token.priceUSD }}</span>
                </div>
                <div class="c-search-result__subtitle">{{ item.token.address }}</div>
            </div>
            <q-icon name="check" class="c-search-result__check" aria-hidden="true"/>
        </div>
    </template>

</div>
</template>

<style lang="scss">
.c-search-result-entry {
}
</style>
