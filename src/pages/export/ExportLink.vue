<script setup lang="ts">
defineProps<{
    account: string;
    type: string; // member of EXPORT_DOWNLOAD_TYPES
    ariaLabel: string; // aria label for the download link, e.g. "Download ERC-20 Transfers CSV"
}>();
</script>

<template>
<div class="c-export-link text-right q-pa-md q-mr-sm">
    [
    <router-link
        :to="{
            name: 'export',
            query: {
                account,
                type,
            }
        }"
    >
        {{ $t('components.export.download_csv') }}
        <q-icon
            name="download"
            size="xs"
            class="no-padding"
        />
    </router-link>
    ]
</div>
</template>

<style lang="scss">
.c-export-link {
    display: inline-block;
}
</style>
