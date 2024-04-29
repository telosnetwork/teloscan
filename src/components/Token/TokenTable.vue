<script>
import AddressField from 'src/components/AddressField';
import AddToWallet from 'src/components/AddToWallet';
import ValueField from 'components/ValueField.vue';
import { mapActions } from 'vuex';

export default {
    name: 'TokenTable',
    components: { AddressField, AddToWallet, ValueField },
    props: {
        tokens: {
            type: Array,
            required: true,
        },
    },
    data() {
        const columns = [
            {
                name: 'icon',
                label: '',
                align: 'left',
            },
            {
                name: 'name',
                label: this.$t('global.name'),
                align: 'left',
            },
            {
                name: 'symbol',
                label: this.$t('global.symbol'),
                align: 'left',
            },
            {
                name: 'balance',
                label: this.$t('components.balance'),
                align: 'left',
            },
            {
                name: 'usd',
                label: this.$t('components.usd_value'),
                align: 'left',
            },
            {
                name: 'action',
                label: this.$t('global.action'),
                align: 'left',
            },
        ];

        return {
            rows: [... this.tokens],
            columns,
        };
    },
    methods: {
        ...mapActions('general', ['toggleDisplayDecimals']),
        async showEntry(token) {
            console.log('showEntry', token);
        },
    },
};
</script>

<template>
<q-table
    :rows="rows"
    :row-key="row => row.address"
    :columns="columns"
    :loading="!(rows)"
    :rows-per-page-options="[0]"
>

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
                    <q-tooltip anchor="bottom middle" self="bottom middle">
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
        <q-tr :props="props" @click="showEntry(props.row)">
            <q-td key="icon" :props="props">
                <q-img :src="props.row.logoURI" class="c-token-icon" />
            </q-td>
            <q-td key="name" :props="props">
                <AddressField :address="props.row.address" :name="props.row.name" :truncate="32"/>
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
