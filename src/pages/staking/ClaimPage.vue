<template>
<div class="row">
    <div class="deposits-container">
        <div>
            <q-table
                :data="deposits"
                :columns="columns"
                :loading="loading"
                :hide-pagination="true"
                flat
            />
        </div>
        <div class="col-xs-12 col-sm-4 u-flex--center claim-button-container">
            <q-btn
                :disabled="!unlockedTlosBalance"
                color="secondary"
                text-color="black"
                @click="claimUnlocked"
            >
                Claim TLOS
            </q-btn>
        </div>
    </div>
    <div v-if="resultHash" class="col-sm-12 col-md-6 offset-md-3">
        Claim successful! View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ethers } from 'ethers';

import TransactionField from 'components/TransactionField';

export default {
    name: 'UnstakeForm',
    components: {
        TransactionField,
    },
    props: {
        escrowContractInstance: {
            type: Object,
            required: true,
        },
        unlockedTlosBalance: {
            type: String,
            default: null,
        },
        deposits: {
            type: Array,
            default: ()=>{ return [] },
        },
    },
    data: () => ({
        resultHash: null,
        columns: [
            {
                name: 'amount',
                label: 'Amount',
                align: 'center',
                field: 'amount',
                format: (val) => { return ethers.utils.formatEther(val.toString());},
            },
            {
                name: 'time',
                label: 'Time Remaining',
                align: 'center',
                field: 'until',
                format: (val) => { return val.toString();},
            },
        ],
        loading: false,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
    },
    methods: {
        claimUnlocked() {
            this.escrowContractInstance.withdraw()
                .then((result) => {
                    this.resultHash = result.hash;
                })
                .catch(({ message }) => {
                    console.error(`Failed to claim unlocked TLOS: ${message}`);
                    this.resultHash = null;
                });
        },
    },
}
</script>

<style lang="sass">
.deposits-container
    margin: auto

.claim-button-container
    margin-top: 1rem
</style>
