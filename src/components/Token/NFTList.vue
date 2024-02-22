<script>
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import { ALLOWED_VIDEO_EXTENSIONS } from 'src/lib/utils';

export default {
    name: 'NFTList',
    props: {
        type: {
            type: String,
            required: false,
            default: 'erc721',
        },
        address: {
            type: String,
            required: true,
        },
        filter: {
            type: String,
            required: false,
            default: 'contract',
        },
    },
    components: {
        AddressField,
        BlockField,
    },

    async mounted() {
        await this.onRequest({
            pagination: this.pagination,
        });
    },
    data() {
        const columns = [
            {
                name: 'minted',
                label: this.$t('components.nfts.minted'),
                align: 'left',
                sortable: true,
            },
            {
                name: 'token_id',
                label: this.$t('components.token_id'),
                align: 'left',
            },
            {
                name: (this.filter === 'account') ? 'contract' : 'owner',
                label: (this.filter === 'account') ? this.$t('components.nfts.contract')
                    : this.$t('components.nfts.owner'),
                align: 'left',
            },
            {
                name: 'name',
                label: this.$t('components.nfts.name'),
                align: 'left',
            },
            {
                name: (this.type === 'erc1155') ? 'amount' : 'minter',
                label: (this.type === 'erc1155') ?
                    this.$t('components.nfts.amount') :
                    this.$t('components.nfts.minter'),
                align: 'left',
            },
            {
                name: 'attributes',
                label:  this.$t('components.nfts.attributes')[0].toUpperCase() +
                    this.$t('components.nfts.attributes').slice(1),
                align: 'left',
            },
            {
                name: 'media',
                label: this.$t('components.nfts.media'),
                align: 'left',
            },
            {
                name: 'metadata',
                label: this.$t('components.nfts.metadata'),
                align: 'center',
            },
        ];
        if(this.type === 'erc1155'){
            columns.shift();
        }
        return {
            columns: columns,
            loading: true,
            showWithoutMetadata: false,
            nfts: [],
            allowedFilters: [
                'contract',
                'account',
            ],
            filterBy: this.filter,
            pagination: {
                sortBy: 'minted',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
        };
    },
    methods: {
        getMedia(nft){
            if(
                !nft.metadata
                && !nft.metadata?.image
                && !nft.metadata?.animation_url
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
        },
        hasVideo(nft){
            let video = this.getMedia(nft);
            let parts = video.split('.');
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
        },
        isDataImage(nft){
            let image = this.getMedia(nft);
            const regex = new RegExp(/(data:image\/[^;]+;base64[^"]+)/);
            return regex.test(image);
        },
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let response = await this.$indexerApi.get(this.getPath(props));

            if(response.data.total_count === 0){
                this.showWithoutMetadata = true;
                response = await this.$indexerApi.get(this.getPath(props));
            }

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;
            if (this.pagination.rowsNumber === 0 && response.data?.total_count) {
                this.pagination.rowsNumber = response.data.total_count;
            }
            let nfts = [];
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
                nft = this.hasVideo(nft);
                nft.tokenUri = (nft.tokenUri) ? nft.tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : null;
                nfts.push(nft);
            }
            this.nfts = nfts;
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            if(!this.allowedFilters.includes(this.filterBy)){
                this.filterBy = 'contract';
            }
            let path = `/${this.filterBy}/${this.address}/nfts?type=${this.type}&includeAbi=true&limit=${
                rowsPerPage === 0 ? 10 : rowsPerPage
            }`;
            path += `&offset=${(page - 1) * rowsPerPage}`;
            path = (this.pagination.rowsNumber === 0) ? path + '&includePagination=true' : path;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            path += `&forceMetadata=${this.showWithoutMetadata ? '0' : '1'}`;
            return path;
        },
    },
};
</script>

<template>
<div :key="this.type">
    <q-table
        v-model:pagination="pagination"
        :rows="nfts"
        :loading="loading"
        :rows-per-page-label="$t('global.records_per_page')"
        :binary-state-sort="true"
        :row-key="row => row.contract + row.tokenId"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
        flat
        @request="onRequest"
    >
        <template v-slot:loading>
            <q-inner-loading showing color="secondary" />
        </template>
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
        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td v-if="type === 'erc721'" key="minted" :props="props">
                    <BlockField v-if="props.row.blockMinted" :block="props.row.blockMinted" />
                </q-td>
                <q-td key="token_id" :props="props">
                    <span v-if="props.row.tokenId.toString().length < 8">{{ props.row.tokenId }}</span>
                    <span  v-else>
                        <span>{{ props.row.tokenId.substr(0, 8) + '...' }}</span>
                        <q-tooltip>{{ props.row.tokenId }}</q-tooltip>
                    </span>
                </q-td>
                <q-td v-if="this.filter !== 'account'" key="owner" :props="props">
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
                <q-td v-if="type === 'erc721'" key="minter" :props="props">
                    <AddressField
                        v-if="props.row.minter"
                        :key="props.row.tokenId + 'minter'"
                        :address="props.row.minter"
                        :truncate="12"
                    />
                </q-td>
                <q-td v-else key="amount" :props="props">
                    x{{ props.row.amount }}
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
                        <a
                            v-if="props.row.imageCache && !isDataImage(props.row)"
                            :href="
                                (props.row.imageCache) ? props.row.imageCache + '/1440.webp' :
                                props.row.metadata?.image
                            "
                            target="_blank"
                        >
                            <q-img
                                :src="props.row.imageCache + '/280.webp'"
                                :alt="props.row.metadata?.name"
                            />
                        </a>
                        <a
                            v-else-if="isDataImage(props.row)"
                            :href="props.row.metadata?.image"
                            target="_blank"
                            download
                        >
                            <q-img :src="props.row.metadata?.image" :alt="props.row.metadata?.name" />
                        </a>
                        <a
                            v-else
                            :href="props.row.metadata?.image"
                            target="_blank"
                        >
                            <q-img :src="props.row.metadata?.image" :alt="props.row.metadata?.name" />
                        </a>
                    </span>
                    <q-tooltip v-if="props.row?.metadata?.description">{{ props.row.metadata.description }}</q-tooltip>
                </q-td>
                <q-td key="metadata" :props="props">
                    <a
                        v-if="props.row.tokenUri && props.row.tokenUri !== '___MISSING_TOKEN_URI___'"
                        clickable="clickable"
                        :href="props.row.tokenUri"
                        target="_blank"
                    >
                        <q-icon name="download" size="sm" />
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
                color="secondary"
                checked-icon="visibility"
                unchecked-icon="visibility_off"
                @update:model-value="onRequest({pagination: pagination})"
            />
        </template>
    </q-table>
</div>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
.q-table .q-toggle.right
    right: 20px
.q-table .q-toggle
    font-size: 12px
    position: absolute
    bottom: 4px
.overlay
    position: absolute
    width: 100%
    height: 100%
    z-index: 55
.q-media
    justify-content: space-evenly
    padding: 0
    margin: 0
    z-index: 1
    max-width: 220px
    max-height: 160px
.q-img
    min-width: 120px
.sortable
    height: 60px
    display: flex
    align-items: center
</style>