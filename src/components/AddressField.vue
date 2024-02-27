<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { contractManager } from 'src/boot/telosApi';
import { getIcon } from 'src/lib/token-utils';
import { toChecksumAddress } from 'src/lib/utils';

import CopyButton from 'components/CopyButton.vue';

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
    highlight: {
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

// ... Rest of the methods code ...
</script>

<template>
<div :key="displayName + address" :class="`c-address-field ${props.class}`">
    <router-link
        :to="`/address/${address}`"
        :class="highlight ? 'highlighted flex items-center' : 'flex items-center'"
    >
        <q-img
            v-if="logo !== null"
            class="q-mr-xs"
            :src="getIcon(logo)"
            width="16px"
            height="auto"
        />
        <q-icon v-else-if="contract && contract.getName()" name="far fa-file"/>
        <span>{{ displayName }}</span>
        <q-tooltip v-if="fullName !== displayName">{{ fullName }}</q-tooltip>
    </router-link>
    <CopyButton v-if="copy && address" :text="address" description="address"/>
</div>
</template>

<style lang="scss" scoped>
.c-address-field {
    min-width: 175px;
}
.c-address-field .q-icon {
    margin-right: 3px;
}
.c-address-field .q-img {
    border-radius: 100%;
}
.c-address-field a {
    vertical-align: middle;
}
.c-address-field {
    display: inline-flex;

    align-items: center;
    gap: 4px;
}
a.highlighted {
    color: #bb9200;
}
body.body--dark a.highlighted {
    color: $warning;
}
</style>
