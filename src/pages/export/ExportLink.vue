<script setup lang="ts">
defineProps<{
    account: string;
    type: string; // member of EXPORT_DOWNLOAD_TYPES
    ariaLabel: string; // aria label for the download link, e.g. "Download ERC-20 Transfers CSV"
}>();
</script>

<template>
<p class="text-right q-pa-sm q-mr-md">
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
</p>
</template>
