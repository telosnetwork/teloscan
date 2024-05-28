<script setup lang="ts">
import { ethers } from 'ethers';
import { ref, computed, watch, onMounted } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

// Interfaces
export interface DecodedTransactionInput {
    method: string;
    name: string;
    args: { name: string; type: string; input: string; value: unknown }[];
    input: string;
}

const props = defineProps<{
    data: DecodedTransactionInput | null,
    input: string,
}>();

const emit = defineEmits(['change']);

const { t: $t } = useI18n();
const currentView = ref<string>('original');

const showView = (view: string) => {
    currentView.value = view;
    emit('change', view);
};

const defaultViewString = computed(() => {
    if (!props.data) {
        return '';
    }
    let str = `Function: ${props.data.name}\n`;
    str += `\nMethodID: ${props.data.input.substring(0, 10)}\n`;
    str += props.data.args.map((arg, index) => `[${index}]:  ${arg.input}`).join('\n');
    return str;
});

const signatureString = computed(() => {
    if (!props.data) {
        return '';
    }
    return `Function: ${props.data.name}`;
});

const decodedData = computed(() => {
    if (!props.data) {
        return null;
    }
    return props.data;
});

const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
});

const columns = computed(() => [
    { name: 'index', align: 'left', label: '#', field: 'index' },
    { name: 'name', align: 'left', label: $t('components.input_viewer.name'), field: 'name' },
    { name: 'type', align: 'left', label: $t('components.input_viewer.type'), field: 'type' },
    { name: 'value', align: 'left', label: $t('components.input_viewer.data'), field: 'value' },
]);

const valueToString = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(v => valueToString(v)).join(', ');
    }
    if (value instanceof Uint8Array) {
        return value.toString();
    }
    if (value instanceof ethers.BigNumber) {
        return value.toString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    if (typeof value?.toString === 'function') {
        return (value as {toString:()=>string}).toString();
    }
    return String(value).toString();
};

const rows = computed(() => {
    if (!decodedData.value) {
        return [];
    }
    return decodedData.value.args.map((arg, index) => ({
        index,
        name: arg.name,
        type: arg.type,
        value: valueToString(arg.value),
    }));
});

const initView = () => {
    if (props.data === null) {
        currentView.value = 'original';
    } else {
        currentView.value = 'original';
    }
};
watch([() => props.data, () => props.input], () => {
    initView();
});
onMounted(() => {
    initView();
});



</script>


<template>
<div class="c-transaction-input-viewer">
    <div class="c-transaction-input-viewer__view">
        <div v-if="currentView === 'original'" class="c-transaction-input-viewer__original">
            {{ props.input }}
        </div>
        <div v-else-if="currentView === 'default'" class="c-transaction-input-viewer__default">
            <q-input
                v-model="defaultViewString"
                borderless
                autogrow
                readonly
                type="textarea"
            />
        </div>
        <div v-else-if="currentView === 'decoded'" class="c-transaction-input-viewer__table">
            <q-input
                v-model="signatureString"
                borderless
                autogrow
                readonly
                type="textarea"
            />
            <q-table
                v-model:pagination.sync="pagination"
                :rows="rows"
                :columns="columns"
                row-key="index"
            >
                <template v-slot:bottom></template>
                <template v-slot:body="props">
                    <q-tr :key="props.row.hash + props.row.parsedTransaction?.transfers?.length" :props="props">
                        <q-td key="index" :props="props" class="c-transaction-input-viewer__table_cell">
                            {{  props.row ? props.row.index : '' }}
                        </q-td>
                        <q-td key="name" :props="props" class="c-transaction-input-viewer__table_cell">
                            {{  props.row ? props.row.name : '' }}
                        </q-td>
                        <q-td key="type" :props="props" class="c-transaction-input-viewer__table_cell">
                            {{  props.row ? props.row.type : '' }}
                        </q-td>
                        <q-td key="value" :props="props" class="c-transaction-input-viewer__table_cell c-transaction-input-viewer__table_cell--value">
                            <span>
                                {{  props.row ? props.row.value : '' }}
                                <q-tooltip>{{  props.row ? props.row.value : '' }}</q-tooltip>
                            </span>
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
    </div>
    <div v-if="props.data !== null" class="c-transaction-input-viewer__controls">
        <!-- TODO: https://github.com/telosnetwork/teloscan/issues/762
        <q-btn
            class="c-transaction-input-viewer__controls-btn"
            :color="currentView === 'default' ? 'primary' : 'default'"
            @click="showView('default')"
        >
            {{ $t('components.input_viewer.default_view') }}
        </q-btn-->
        <q-btn
            class="c-transaction-input-viewer__controls-btn"
            :color="currentView === 'original' ? 'primary' : 'default'"
            @click="showView('original')"
        >
            {{ $t('components.input_viewer.original_view') }}
        </q-btn>
        <q-btn
            class="c-transaction-input-viewer__controls-btn"
            :color="currentView === 'decoded' ? 'primary' : 'default'"
            @click="showView('decoded')"
        >
            {{ $t('components.input_viewer.decoded_view') }}
        </q-btn>
    </div>
</div>
</template>

<style lang="scss">
.c-transaction-input-viewer {
    &__table {
        .q-table__card {
            box-shadow: none;
        }
        .q-table__bottom {
            display: none;
        }

        &_cell {
            &--value {
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 700px;
            }
        }
    }

    &__controls {
        padding-top: 10px;
        display: flex;
        gap: 8px;

        &-btn.bg-default {
            color: var(--text-color) !important;
        }
    }

    textarea {
        font-family: monospace;
    }
}
</style>
