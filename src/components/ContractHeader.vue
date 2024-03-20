<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// import AddressField from 'components/AddressField.vue';
// import CopyButton from 'components/CopyButton.vue';

// Are you the contract creator? Verify and Publish your contract source code today!

// const { t: $t } = useI18n();

defineProps({
    contract: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
});

</script>

<template>
<div>
    <q-card class="c-more-info">
        <q-card-section class="c-more-info__header"/>
    </q-card>
</div>
</template>

<style lang="scss">
.c-more-info{
    height:100%;
    text-transform: uppercase;

    &__copy{
        display: inline;
        font-size: 16px;
    }
    &__header {
        font-size: 18px;
        font-weight: 600;
    }
}
</style>
