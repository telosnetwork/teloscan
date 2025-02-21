<script lang='ts' setup>
// src/components/Token/TokenTable.vue

import { ref } from 'vue';
import { defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import AddressField from 'src/components/AddressField.vue';
import AddToWallet from 'src/components/AddToWallet.vue';
import ValueField from 'src/components/ValueField.vue';
import EmptyTableSign from 'src/components/EmptyTableSign.vue';

// Define the interface for a Token
interface Token {
    [key: string]: string,
}

// Define component props
const props = defineProps<{
    tokens: Token[],
}>();

// Initialize i18n translation function
const { t: $t } = useI18n();

// Create a reactive copy of tokens for rows
const rows = ref([...props.tokens]);

// Define table columns with translations
const columns = [
    {
        name: 'icon',
        label: '',
        align: 'left',
    },
    {
        name: 'name',
        label: $t('global.name'),
        align: 'left',
    },
    {
        name: 'symbol',
        label: $t('global.symbol'),
        align: 'left',
    },
    {
        name: 'balance',
        label: $t('components.balance'),
        align: 'left',
    },
    {
        name: 'usd',
        label: $t('components.usd_value'),
        align: 'left',
    },
    {
        name: 'action',
        label: $t('global.action'),
        align: 'left',
    },
];

// Setup Vuex store
const store = useStore();

// Map Vuex action to toggle display decimals
const toggleDisplayDecimals = (): Promise<never> => store.dispatch('general/toggleDisplayDecimals') as Promise<never>;

</script>

<template>
<q-table
    :rows="rows"
    :row-key="row => row.address"
    :columns="(columns as any)"
    :loading="!(rows)"
    :rows-per-page-options="[0]"
>
    <template v-slot:no-data>
        <EmptyTableSign />
    </template>

    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
            >
                <div v-if="col.name==='balance'" class="u-flex--center-y" @click="toggleDisplayDecimals">
                    <a>{{ col.label }}</a>
                    <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                    <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                        {{ $t('components.click_to_change_format') }}
                    </q-tooltip>
                </div>
                <template v-else>
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                </template>
            </q-th>
        </q-tr>
    </template>

    <template v-slot:body="props">
        <q-tr :props="props">
            <q-td key="icon" :props="props">
                <q-img :src="props.row.logoURI" class="c-token-icon" />
            </q-td>
            <q-td key="name" :props="props">
                <AddressField
                    :address="props.row.address"
                    :name="props.row.name"
                    :truncate="32"
                    :useHighlight="false"
                />
            </q-td>
            <q-td key="symbol" :props="props">
                {{ props.row.symbol }}
            </q-td>
            <q-td key="balance" :props="props">
                <ValueField
                    :value="props.row.fullBalance"
                />
            </q-td>
            <q-td key="usd" :props="props">
                <span v-if="props.row.price > 0">
                    <span v-if="props.row.fullBalance > 0.0001">
                        {{ props.row.valueUSD }}$
                    </span>
                    <span v-else>
                        {{ '< 0.0001 $' }}
                    </span>
                </span>
                <span v-else>-</span>
            </q-td>
            <q-td key="action" :props="props">
                <AddToWallet
                    :token="props.row"
                    :icon="true"
                    :label="$t('components.add_to_metamask', { symbol : props.row.symbol })"
                />
            </q-td>
        </q-tr>
    </template>
    <template v-slot:bottom>
    </template>
</q-table>
</template>
<style lang='scss' scoped>
tbody {
    tr {
      td:first-child {
        width: 50px;
      }
      td:last-child {
        width: 100px;
      }
    }
  }

  .c-token-icon {
    width: 32px;
    height: auto;
    border-radius: 100%;
  }

</style>
