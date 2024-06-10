<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IPFS_GATEWAY, extractNftMetadata } from 'src/antelope/stores/utils/nft-utils';
import { useChainStore } from 'src/antelope';

const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    contract: {
        type: Object,
        default: () => null,
    },
});

const img = ref<string | undefined>('');
const mediatype = ref<string | undefined>('');
const source = ref<string | undefined>('');
const name = ref<string | undefined>('');
const collection = ref<string | undefined>('');

onMounted(() => {
    const contract = props.contract.address;
    const tokenId = props.id;
    const url = `https://api.teloscan.io/v1/contract/${contract}/nfts?tokenId=${tokenId}`;
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    indexerApi.get(url).then(async (response) => {
        const indexerData = response.data.results[0];

        indexerData.tokenUri = ((indexerData.tokenUri as string) ?? '').replace('ipfs://', IPFS_GATEWAY);
        if (typeof indexerData.metadata === 'string') {
            try {
                indexerData.metadata = JSON.parse(indexerData.metadata);
                name.value = indexerData.metadata.name;
                collection.value =response.data.contracts[indexerData.contract].name;
                const { image, mediaType, mediaSource } = await extractNftMetadata(indexerData.imageCache ?? '', indexerData.tokenUri ?? '', indexerData.metadata ?? {});
                img.value = ((image as string) ?? '').replace('ipfs://', IPFS_GATEWAY);
                mediatype.value = mediaType;
                source.value = mediaSource;
            } catch (e) {
                console.error('Error parsing metadata', indexerData.metadata);
            }
        }
    });
});

</script>

<template>
<div class="c-nft-item-field">
    <!-- image / preview -->
    <q-img v-if="img" :src="img" class="c-nft-item-field__media c-nft-item-field__media--image" />
    <template v-else>
        <q-icon
            v-if="mediatype === 'video'"
            name="ondemand_video"
            class="c-nft-item-field__media c-nft-item-field__media--video"
            size="32px"
        />
        <q-icon
            v-else-if="mediatype === 'audio'"
            name="volume_up"
            class="c-nft-item-field__media c-nft-item-field__media--audio"
            size="32px"
        />
        <q-icon
            v-else
            name="broken_image"
            class="c-nft-item-field__media c-nft-item-field__media--broken"
            size="32px"
        />
    </template>

    <!-- data -->
    <div class="c-nft-item-field--data">
        <div class="c-nft-item-field--data--name">{{ name }}</div>
        <div class="c-nft-item-field--data--collection">{{ collection }}</div>
    </div>
</div>
</template>

<style lang="scss">
.c-nft-item-field {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 160px;

    &__media {
        width: 32px;
        height: 32px;
        border-radius: 4%;
        object-fit: cover;

        .q-img__loading .q-spinner {
            font-size: 20px;
        }
    }
    &--data {
        display: flex;
        flex-direction: column;
        gap: 3px;
        overflow: auto;

        &--name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        &--collection {
            font-size: 0.8em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}
</style>
