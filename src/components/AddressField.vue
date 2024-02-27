<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { contractManager } from 'src/boot/telosApi';
import { getIcon } from 'src/lib/token-utils';
import { toChecksumAddress } from 'src/lib/utils';

import CopyButton from 'components/CopyButton.vue';

const props = defineProps({
    highlightAddress: {
        type: String,
        required: false,
        default: '',
    },
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
    isContractTrx: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['highlight']);

const displayName = ref('');
const fullName = ref(toChecksumAddress(props.address));
const contract = ref<any>(null);
const logo = ref<any>(null);
const tokenList = ref<any>(null);

watch(() => props.address, async () => {
    await loadContract();
});

onMounted(async () => {
    tokenList.value = await contractManager.getTokenList();
    await loadContract();
    await getDisplay();
});

const truncateText = (text: string, middle?: boolean) => {
    if (props.truncate === 0 || text.length <= props.truncate) {
        return text;
    }
    if (middle) {
        // eslint-disable-next-line max-len
        return `${text.slice(0, (props.truncate / 2))}...${text.slice(text.length - (props.truncate / 2), text.length)}`;
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
    if (contract.value && contract.value.getName() && contract.value.getName().length > 0) {
        if(tokenList.value?.tokens){
            tokenList.value.tokens.forEach((token: any) => {
                if(token.address.toLowerCase() === contract.value.address.toLowerCase()){
                    logo.value = (token.logoURI);
                }
            });
        }
        logo.value = (logo.value === null && contract.value.getSupportedInterfaces().includes('erc20'))
            ? ''
            : logo.value
        ;
        const name = (contract.value.isToken() && contract.value.getProperties()?.symbol)
            ? contract.value.getProperties().symbol
            : contract.value.getName()
                ;
        if(!name.startsWith('0x')){
            displayName.value = truncateText(name);
            return;
        }
    }
    // This formats the address for us and handles zero padding we get from log events
    displayName.value = truncateText(address, true);
};

const loadContract = async () => {
    let contractObj = await contractManager.getContract(props.address, true);
    if (contractObj) {
        fullName.value = (contractObj.getName() && !contractObj.getName().startsWith('0x'))
            ? contractObj.getName()
            : fullName.value;
        contract.value = contractObj;
    }
};

function emitHighlight(val: string) {
    emit('highlight', val);
}

</script>

<template>
<div
    :key="displayName + address"
    class='c-address-field'
    @mouseover="emitHighlight(address)"
    @mouseleave="emitHighlight('')"
>
    <router-link
        :to="`/address/${address}`"
        :class="{'c-address-field--highlight': highlightAddress === props.address && highlightAddress !== ''}"
    >
        <q-img
            v-if="logo !== null"
            class="q-mr-xs"
            :src="getIcon(logo)"
            width="16px"
            height="auto"
        />
        <q-icon v-else-if="contract && contract.getName()" name="far fa-file" class="c-address-field__contract-icon"/>
        <span>{{ displayName }}</span>
        <q-tooltip v-if="fullName !== displayName">{{ fullName }}</q-tooltip>
    </router-link>
    <CopyButton v-if="copy && address" :text="address" description="address"/>
</div>
</template>

<style lang="scss">
.c-address-field {
    min-width: 140px;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &__contract-icon{
        padding-bottom: 6px;
    }

    &--highlight{
        background: lightgoldenrodyellow;
        border: 1px dashed orange;
        border-radius: 5px;
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
