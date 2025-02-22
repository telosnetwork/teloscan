<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ALLOWED_VIDEO_EXTENSIONS } from 'src/lib/utils';

import AddressField from 'components/AddressField.vue';
import BlockField from 'components/BlockField.vue';
import ImagePopup from 'src/components/ImagePopup.vue';
import EmptyTableSign from 'components/EmptyTableSign.vue';

import { NFT, NFT_TYPE } from 'src/types/NFT';
import { useChainStore } from 'src/core';
import { QTableProps, useQuasar } from 'quasar';
import { useRoute } from 'vue-router';



const allowedFilters = ['contract', 'account'];

const { t : $t } = useI18n();
const $q = useQuasar();
const $route = useRoute();

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
    filter: {
        type: String,
        required: false,
        default: 'account',
    },
});

const columns = ref<QTableProps['columns']>([]);
const loading = ref(true);
const showWithoutMetadata = ref(false);
const nfts = ref<NFT[]>([]);
const loadingRows = ref<Array<number>>([]);
const pagination = ref({
    sortBy: '',
    descending: true,
    page: 1,
    rowsPerPage: 10,
});

watch(() => props.filter, () => {
    setupColumns();
});

function setupColumns() {
    columns.value = [
        {
            name: 'minted',
            label: $t('components.nfts.minted'),
            align: 'left',
            sortable: true,
            field: '',
        },
        {
            name: 'token_id',
            label: $t('components.token_id'),
            align: 'left',
            field: '',
        },
        {
            name: (props.filter === 'account') ? 'contract' : 'owner',
            label: (props.filter === 'account') ? $t('components.nfts.contract')
                : $t('components.nfts.owner'),
            align: 'left',
            field: '',
        },
        {
            name: 'name',
            label: $t('components.nfts.name'),
            align: 'left',
            field: '',
        },
        {
            name: 'minter',
            label: $t('components.nfts.minter'),
            align: 'left',
            field: '',
        },
        {
            name: 'amount',
            label: $t('components.nfts.amount'),
            align: 'left',
            field: '',
        },
        {
            name: 'attributes',
            label: $t('components.nfts.attributes')[0].toUpperCase() +
                $t('components.nfts.attributes').slice(1),
            align: 'left',
            field: '',
        },
        {
            name: 'media',
            label: $t('components.nfts.media'),
            align: 'left',
            field: '',
        },
        {
            name: 'metadata',
            label: $t('components.nfts.metadata'),
            align: 'center',
            field: '',
        },
    ];
}

onBeforeMount(() => {
    for (var i = 1; i <= pagination.value.rowsPerPage; i++) {
        loadingRows.value.push(i);
    }
});

onMounted(async () => {
    await onRequest();
    setupColumns();
});

function getMedia(nft: NFT) {
    if(
        !nft.metadata
                && !(nft.metadata as any)?.image
                && !(nft.metadata as any)?.animation_url
                && (!nft.tokenUri || nft.tokenUri.endsWith('.json'))
    ){
        return false;
    }
    let media = (nft.metadata?.animation_url && nft.metadata.animation_url.length > 0)
        ? nft.metadata.animation_url
        : nft.metadata?.image
            ;
    media = (typeof media !== 'undefined' && media) ? media : nft.metadata?.properties?.image;
    media = (typeof media !== 'undefined' && media) ? media : nft.tokenUri;
    if(!media){
        return false;
    }
    return media;
}

function hasVideo(nft: NFT) {
    const video = getMedia(nft);
    let parts = [];
    if (video){
        parts = video?.split('.');
    }
    if(parts.length > 1){
        let ext = parts[parts.length - 1].split('?')[0];
        if(!ALLOWED_VIDEO_EXTENSIONS.includes(ext)){
            return nft;
        }
        nft.metadata = (typeof nft.metadata === 'string') ? {} : nft.metadata;
        nft.metadata.animation = video.replace('ipfs://', 'https://ipfs.io/ipfs/');
        nft.metadata.animationExtension = ext;
    }
    nft.tokenUri = (nft.tokenUri) ? nft.tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : null;
    return nft;
}

async function onRequest() {
    loading.value = true;
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();

    const { page, rowsPerPage, sortBy, descending } = pagination.value;

    const erc721 = await indexerApi.get(getPath(NFT_TYPE.ERC721));
    const erc1155 = await indexerApi.get(getPath(NFT_TYPE.ERC1155));

    // merge erc1155 data into erc721 results
    const response = erc721;
    response.data.total_count += erc1155.data.total_count;
    response.data.results = [...response.data.results, ...erc1155.data.results];

    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;

    let nftsArr = [];
    for (let nft of response.data.results) {
        nft.metadata = (nft.metadata) ? JSON.parse(nft.metadata) : nft.metadata;
        if(nft.metadata?.image){
            nft.metadata.image = (nft.metadata.image)
                ? nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : false
            ;
        }
        if(nft.metadata?.attributes){
            nft.metadata.attributesStr = '';
            for(let i = 0; i < nft.metadata.attributes.length; i++){
                nft.metadata.attributesStr += (typeof nft.metadata.attributes[i]['trait_type'] !== 'undefined')
                    ? nft.metadata.attributes[i]['trait_type']  + ' : '
                    : ''
                ;
                nft.metadata.attributesStr += nft.metadata.attributes[i]['value'] + '\n';
            }
        }
        nft = hasVideo(nft);
        nft.tokenUri = (nft.tokenUri) ? nft.tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : null;
        nftsArr.push(nft);
    }
    nfts.value = nftsArr;
    loading.value = false;
}

function getPath(type: string) {
    let queryFilter = props.filter;
    if(!allowedFilters.includes(queryFilter)){
        queryFilter = 'contract';
    }
    return `/v1/${queryFilter}/${props.address}/nfts?type=${type}&includeAbi=true&limit=10000&forceMetadata=1&includePagination=true`;
}

// Media display
const previewSize = ref(36);
const toggleMediaSize = () => {
    previewSize.value = (previewSize.value === 36) ? 72 : 36;
    // save in storage
    localStorage.setItem('mediaSize', previewSize.value.toString());
};
onMounted(() => {
    const size = localStorage.getItem('mediaSize');
    if(size){
        previewSize.value = parseInt(size);
    }
});

watch(() => $route.query.network, () => {
    onRequest();
});

</script>

<template>
<div :key="address">
    <q-table
        v-if="!loading"
        v-model:pagination="pagination"
        :rows="nfts"
        :rows-per-page-label="$t('global.records_per_page')"
        :binary-state-sort="true"
        :row-key="row => row.contract + row.tokenId"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
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
                    <div v-if="col.name==='media'" class="u-flex--center-y" @click="toggleMediaSize">
                        <a>{{ col.label }}</a>
                        <q-icon class="info-icon q-ml-xs" name="far fa-question-circle"/>
                        <q-tooltip v-it="$q.screen.gt.md" anchor="bottom middle" self="top middle">
                            {{ $t('components.click_to_toggle_media_size') }}
                        </q-tooltip>
                    </div>
                    <div v-else class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                </q-th>
            </q-tr>
        </template>
        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td key="minted" :props="props">
                    <BlockField v-if="props.row.blockMinted" :block="props.row.blockMinted" />
                </q-td>
                <q-td key="token_id" :props="props">
                    <span v-if="props.row.tokenId.toString().length < 8">{{ props.row.tokenId }}</span>
                    <span  v-else>
                        <span>{{ props.row.tokenId.substr(0, 8) + '...' }}</span>
                        <q-tooltip>{{ props.row.tokenId }}</q-tooltip>
                    </span>
                </q-td>
                <q-td v-if="filter !== 'account'" key="owner" :props="props">
                    <AddressField :key="props.row.tokenId + 'owner'"  :address="props.row.owner" :truncate="12" />
                </q-td>
                <q-td v-else key="contract" :props="props">
                    <AddressField :key="props.row.tokenId + 'contract'" :address="props.row.contract" :truncate="12" />
                </q-td>
                <q-td key="name" :props="props">
                    <span v-if="props.row.metadata?.name && props.row.metadata?.name.length < 22">
                        <span :key="props.row.tokenId + 'name'">
                            {{ props.row.metadata?.name }}
                        </span>
                    </span>
                    <span v-else-if="props.row.metadata?.name">
                        <span :key="props.row.tokenId + 'name'">
                            {{ props.row.metadata?.name.substring(0, 22) }}...
                        </span>
                        <q-tooltip>{{ props.row.metadata?.name }}</q-tooltip>
                    </span>
                </q-td>
                <q-td key="minter" :props="props">
                    <AddressField
                        :key="props.row.tokenId + 'minter'"
                        :address="props.row.minter ?? props.row.owner"
                        :truncate="12"
                    />
                </q-td>
                <q-td  key="amount" :props="props">
                    x{{ props.row.amount ?? 1 }}
                </q-td>
                <q-td key="attributes" :props="props">
                    <div v-if="props.row.metadata?.attributes" class="flex items-center">
                        <q-icon name="list" size="xs" class="q-mr-xs" />
                        <span>{{ props.row.metadata.attributes.length }}</span>
                        <q-tooltip>
                            <pre>{{ props.row.metadata.attributesStr }}</pre>
                        </q-tooltip>
                    </div>
                </q-td>
                <q-td key="media" :props="props">
                    <a
                        v-if="props.row.metadata?.animation"
                        :href="props.row.metadata.animation"
                        target="_blank"
                    >
                        <div class="overlay"></div>
                        <q-media-player
                            type="video"
                            loop="loop"
                            :autoplay="true"
                            :show-big-play-button="false"
                            muted="muted"
                            big-play-button-color="purpleBright"
                            :hideVolumeSlider="true"
                            :noControls="true"
                            :hideVolumeBtn="true"
                            :hidePlayBtn="true"
                            :hideSettingsBtn="true"
                            :hideFullscreenBtn="true"
                            :sources="[{
                                type: 'video/' + props.row.metadata.animationExtension,
                                src: props.row.metadata.animation,
                            }]"
                        />
                    </a>
                    <span
                        v-else-if="props.row.imageCache || props.row.metadata?.image"
                        clickable="clickable"
                    >
                        <ImagePopup
                            :image="
                                (props.row.imageCache) ? props.row.imageCache + '/1440.webp' :
                                props.row.metadata?.image
                            "
                            :title="props.row.metadata?.name"
                            :previewSize="previewSize"
                        />
                    </span>
                    <q-tooltip v-if="props.row?.metadata?.description && $q.screen.gt.md">{{ props.row.metadata.description }}</q-tooltip>
                </q-td>
                <q-td key="metadata" :props="props">
                    <a
                        v-if="props.row.tokenUri && props.row.tokenUri !== '___MISSING_TOKEN_URI___'"
                        clickable="clickable"
                        :href="props.row.tokenUri"
                        target="_blank"
                    >
                        <q-icon size="sm" name="launch"/>
                        <q-tooltip v-if="props.row.tokenUri">{{ $t('components.nfts.ipfs') }}</q-tooltip>
                    </a>
                </q-td>
            </q-tr>
        </template>
        <template v-slot:bottom-row>
            <q-toggle
                v-model="showWithoutMetadata"
                :label="$t('components.nfts.show_without_metadata')"
                :class="(nfts.length > 0) ? '' : 'right'"
                color="primary"
                checked-icon="visibility"
                unchecked-icon="visibility_off"
                @update:model-value="onRequest()"
            />
        </template>
    </q-table>
    <q-table
        v-else
        v-model:pagination="pagination"
        :rows="loadingRows"
        :rows-per-page-label="$t('global.records_per_page')"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
    >
        <template v-slot:header="props">
            <q-tr :props="props">
                <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                >
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                </q-th>
            </q-tr>
        </template>
        <template v-slot:body="">
            <q-tr >
                <q-td key="minted" >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="token_id" >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td v-if="filter !== 'account'" key="owner" >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td v-else key="contract">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="name">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="minter">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td  key="amount">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="attributes">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="media">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="metadata">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
    </q-table>
</div>
</template>

<style scoped lang="scss">
.q-table .q-toggle.right {
    right: 20px;
}
.q-table .q-toggle {
    font-size: 12px;
    position: absolute;
    bottom: 4px;
}
.overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 55;
}
.q-media {
    justify-content: space-evenly;
    padding: 0;
    margin: 0;
    z-index: 1;
    max-width: 220px;
    max-height: 160px;
}
.q-img {
    min-width: 120px;
}
.sortable {
    height: 60px;
    display: flex;
    align-items: center;
}
.cursor-pointer {
    cursor: pointer;
}
</style>
