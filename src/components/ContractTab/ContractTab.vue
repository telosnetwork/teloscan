<script setup lang="ts">
import { ref, computed } from 'vue';

import ContractSource from 'components/ContractTab/ContractSource.vue';
import ContractInterface from 'components/ContractTab/ContractInterface.vue';
import CopyButton from 'components/CopyButton.vue';

const props = defineProps({
    contract: {
        type: Object,
        default: () => ({}),
    },
});

const source = ref(props.contract.abi?.length > 0);
const write = ref(false);

const verified = computed(() => props.contract.verified);
const abi = computed(() => {
    if (!props.contract.abi || !Array.isArray(props.contract.abi)) {
        return false;
    }
    return JSON.stringify(props.contract.abi);
});

const codeSelected = computed(() => source.value === true);
const readSelected = computed(() => source.value === false && write.value === false);
const writeSelected = computed(() => source.value === false && write.value === true);

</script>

<template>
<q-card>
    <div v-if="abi" :key="contract.address + abi.length" class="c-contract">
        <div class="flex justify-between items-center">
            <div class="c-contract__tab-container">
                <q-btn
                    :label="$t('components.contract_tab.code')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': codeSelected,
                    }"
                    @click="source = true; write = false"
                />
                <q-btn
                    :label="$t('components.contract_tab.read')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': readSelected,
                    }"
                    @click="source = false; write = false"
                />
                <q-btn
                    :label="$t('components.contract_tab.write')"
                    :class="{
                        'c-contract__tab': true,
                        'c-contract__tab--active': writeSelected,
                    }"
                    @click="source = false; write = true"
                />
            </div>
            <CopyButton
                v-if="verified && !contract?.autoloadedAbi"
                :text="abi"
                :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
            />
        </div>
        <ContractSource v-if="source" :contract="contract"/>
        <ContractInterface
            v-else
            :write="write"
            :contract="contract"
        />
    </div>
</q-card>

</template>

<style lang='scss' scoped>
.c-contract{
    padding-top: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;

    &__tab-container{
        display: inline-flex;
        gap: .5rem;
    }

    &__tab{
        cursor: pointer;
        border-radius: 5px;
        color: var(--text-color);
        text-transform: capitalize !important;
        background-color: var(--tab-bg-color);

        &:hover{
            color: var(--text-color);
        }

        &--active {
            color: var(--active-tab-text-color);
            background-color: var(--active-tab-bg-color);
        }
    }

    .vjs-tree-list-holder-inner {
        padding-bottom: 20px;
    }
}

@media screen and (max-width: 764px) {
    .c-contract > .items-center .c-copy-button {
        margin-top: 12px;
    }

    .c-contract > .items-center {
        display: block;
    }
}
</style>
