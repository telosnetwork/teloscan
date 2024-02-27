<script lang="ts" setup>

defineProps({
    trx: {
        type: Object,
        default: null,
    },
});

</script>

<template>
<div class="transaction-summary">
    <q-btn
        size="6px"
        round
        icon="far fa-eye"
    >
        <q-menu
            anchor="top right"
            self="top left"
        >
            <q-card>
                <q-card-section>
                    <div>
                        <p>
                            <strong>Status: </strong>
                            <span v-if="trx.status == 1" class="positive">
                                <q-icon name="check"/>
                                <span>{{ $t('pages.success') }}</span>
                            </span>
                            <span v-else class="negative">
                                <q-icon name="warning"/>
                                <span>{{ $t('pages.failure') }}</span>
                            </span>
                        </p>
                    </div>
                    <div>
                        <strong>Transaction Action:</strong>
                        <p>
                            Transfer for {{ trx.value }} TLOS from     <router-link
                                :to="`/address/${trx.from}`"
                            > {{ trx.from.slice(0,7) }}...</router-link> to <router-link
                                :to="`/address/${trx.to}`"
                            > {{ trx.to.slice(0,7) }}...</router-link>
                        </p>
                    </div>
                    <div>
                        <strong>Transaction Fee:</strong>
                        <p>{{ trx.gasUsed ?? trx.gasused }} TLOS </p>
                    </div>
                    <div>
                        <strong>Gas Info:</strong>
                        <p>{{ trx.gasUsed ?? trx.gasused }} gas used from {{ trx.gasLimit }} limit</p>
                    </div>
                    <div>
                        <strong>Nonce:</strong>
                        <p>{{ trx.nonce }}</p>
                    </div>
                    <div>
                        <p>
                            <router-link :key="$route.path" :to="`/tx/${trx.hash}`">
                                See more details
                            </router-link>
                        </p>
                    </div>
                </q-card-section>
            </q-card>
        </q-menu>
    </q-btn>
</div>
</template>

<style lang="scss">
.transaction-summary {
    .q-btn {
        margin-right: 4px;
    }
    .q-card {
        width: 330px;
    }
}

.positive, .negative {
    border: 1px solid;
    border-radius: 5px;
    padding: 5px 10px;
}

.positive {
    background: $positive;
}

.negative {
    background: $negative;
}
</style>
