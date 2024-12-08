<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { getIcon } from 'src/lib/token-utils';
import { toChecksumAddress } from 'src/lib/utils';

import CopyButton from 'components/CopyButton.vue';
import { useStore } from 'vuex';
import { useChainStore } from 'src/core';

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
    class: {
        type: String,
        default: '',
    },
    name: {
        type: String,
        default: '',
    },
    copy: {
        type: Boolean,
        default: false,
    },
    truncate: {
        type: Number,
        default: 0,
    },
    hideContractIcon: {
        type: Boolean,
        default: false,
    },
    useHighlight: {
        type: Boolean,
        default: true,
    },
});


const displayName = ref('');
const fullName = ref(toChecksumAddress(props.address));
const displayInfo = ref<{ name:string, interfaces:string[], symbol?:string } | null>(null);
const contractName = ref('');
const logo = ref<any>(null);
const tokenList = ref<any>(null);
const checksum = ref('');

const restart = async () => {
    if (!props.address) {
        return;
    }
    tokenList.value = await useChainStore().currentChain.settings.getContractManager().getTokenList();
    checksum.value = toChecksumAddress(props.address);
    await loadDisplayInfo();
    await getDisplay();
};

const $store = useStore();
const setHighlightAddress = (method: string) => props.useHighlight ? $store.dispatch('general/setHighlightAddress', method) : null;
const highlightAddress = computed(() => props.useHighlight ? $store.state.general.highlightAddress : '');

watch(() => props.address, async () => {
    restart();
});

onMounted(async () => {
    restart();
});

const truncateText = (text: string, middle?: boolean) => {
    if (props.truncate === 0 || text.length <= props.truncate) {
        return text;
    }
    if (middle) {
        return `${text.slice(0, (props.truncate / 2 + 2))}...${text.slice(text.length - (props.truncate / 2), text.length)}`;
    }
    return `${text.slice(0, props.truncate)}...`;
};

const getDisplay = async () => {
    if (props.name) {
        displayName.value = truncateText(props.name);
        return;
    }
    if (!props.address) {
        return;
    }
    let address = toChecksumAddress(props.address);
    fullName.value = address;
    if (contractName.value) {
        if(tokenList.value?.tokens){
            tokenList.value.tokens.forEach((token: any) => {
                if(token.address.toLowerCase() === props.address.toLowerCase()){
                    logo.value = (token.logoURI);
                }
            });
        }
        logo.value = (logo.value === null && displayInfo.value?.symbol)
            ? ''
            : logo.value
        ;
        const name = (displayInfo.value?.symbol) ?? contractName.value;

        if(!name.startsWith('0x')){
            displayName.value = truncateText(name);
            return;
        }
    }
    // This formats the address for us and handles zero padding we get from log events
    displayName.value = truncateText(address, true);
};

const loadDisplayInfo = async () => {
    let info = await useChainStore().currentChain.settings.getContractManager().getContractDisplayInfo(props.address);

    if (info) {
        contractName.value = info.name ?? '';
        fullName.value = contractName.value || fullName.value;
        displayInfo.value = info;
    }
};

</script>

<template>
<div
    :key="displayName + checksum"
    :class="['c-address-field', props.class]"
    @mouseover="setHighlightAddress(checksum)"
    @mouseleave="setHighlightAddress('')"
>
    <router-link
        :to="`/address/${checksum}`"
        :class="{
            'c-address-field__link': true,
            'c-address-field__link--highlight': highlightAddress === checksum && highlightAddress !== ''
        }"
    >
        <q-img
            v-if="logo !== null && hideContractIcon === false"
            class="q-mr-xs"
            :src="getIcon(logo)"
            width="16px"
            height="auto"
        />
        <q-icon v-else-if="displayInfo && hideContractIcon === false" name="far fa-file-code" />
        <span class="c-address-field__text">{{ displayName }}</span>
        <q-tooltip v-if="fullName !== displayName">{{ fullName }}</q-tooltip>
    </router-link>
    <CopyButton v-if="copy && address" :text="address" description="address"/>
</div>
</template>

<style lang="scss">
.c-address-field {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &__link {
        display: flex;
        align-items: center;
        gap: 4px;
        position: relative;

        &--highlight {
            background: rgba($secondary, 0.2);
            outline: 1px dashed $secondary;
            border-radius: 5px;
        }
    }

    &__text {
        word-break: break-word;
    }

    .q-icon {
        margin-right: 3px;
    }

    .q-img {
        border-radius: 100%;
    }

    a {
        vertical-align: middle;
    }
}
</style>
