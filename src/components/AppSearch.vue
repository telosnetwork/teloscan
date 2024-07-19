<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { evm } from 'src/boot/evm';
import {
    SearchResult,
    SearchResultRaw,
    SearchResultCategory,
    SearchResultInterfaces,
    SearchResultContract,
    SearchResultToken,
    SearchResultNFT,
    SearchResultAddress,
    SearchResultTrx,
    SearchResultBlock,
    SearchResultUnknown,
} from 'src/types';

const props = defineProps<{
    homepageMode?: boolean; // if true, the search bar will be styled for placement on the homepage
}>();

const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

const TIME_DELAY = 6000;
const NULL_ADDRESS = '0x' + '0'.repeat(40);
const NULL_HASH = '0x' + '0'.repeat(64);

const searchTerm = ref<string>('');
const inputRef = ref<{$el:HTMLInputElement}|null>(null);
const showAutocomplete = ref<boolean>(false);
const searchResults = ref<Array<SearchResult>>([]);
const selectedTab = ref<string>('tokens');

console.log($router, $q, TIME_DELAY, evm, axios); // FIXME: remove this line

// Logic to resolve and depurate search results ----

const resolveCategory = (entry: SearchResultRaw): SearchResultCategory => {
    switch (entry.type) {
    case 'contract':
        if (entry.supportedInterfaces?.includes('erc20')) {
            return 'tokens';
        } else if (
            entry.supportedInterfaces?.includes('erc721') ||
            entry.supportedInterfaces?.includes('erc721_metadata') ||
            entry.supportedInterfaces?.includes('erc1155') ||
            entry.supportedInterfaces?.includes('erc1155_metadata')
        ) {
            return 'nft';
        } else {
            return 'contract';
        }
    case 'address':
        return 'address';
    case 'transaction':
        return 'transaction';
    case 'block':
        return 'block';
    default:
        return 'unknown';
    }
};

const resolvePriceUSD = (entry: SearchResultToken | SearchResultNFT): string => {
    if(+entry.price > 0) {
        if (entry.price > 0.0001) {
            return `$${Math.round((entry.price) * 10000) / 10000}`;
        } else {
            return '< $0.0001';
        }
    } else {
        return '$0';
    }
};

const resolveIcon = (entry: SearchResultToken): string => {
    // TODO: implement this function
    if (entry.category === 'token') {
        return 'assets/logo--teloscan.png';
    } else {
        return 'assets/logo--teloscan.png';
    }
};

const convertRawToProcessedResult = (entry: SearchResultRaw): SearchResult => {
    switch (resolveCategory(entry)) {
    case 'contract':
        return {
            category: 'contract',
            type: 'contract',
            address: entry.address ?? NULL_ADDRESS,
            name: entry.name ?? '',
            verified: entry.verified ?? false,
            supportedInterfaces: entry.supportedInterfaces?.split(' ') as SearchResultInterfaces[] ?? [],
        } as SearchResultContract;
    case 'tokens':
        return {
            category: 'token',
            type: 'contract',
            address: entry.address ?? NULL_ADDRESS,
            name: entry.name ?? '',
            symbol: entry.symbol ?? '',
            price: entry.price ?? 0,
            decimals: entry.decimals ?? 0,
            verified: entry.verified ?? false,
            issuer: entry.issuer ?? null,
            supportedInterfaces: entry.supportedInterfaces?.split(' ') as SearchResultInterfaces[] ?? [],
            priceUSD: resolvePriceUSD(entry as unknown as SearchResultToken),
            icon: resolveIcon(entry as unknown as SearchResultToken),
        } as SearchResultToken;
    case 'nft':
        return {
            category: 'nft',
            type: 'contract',
            address: entry.address ?? NULL_ADDRESS,
            name: entry.name ?? '',
            symbol: entry.symbol ?? '',
            price: entry.price ?? 0,
            verified: entry.verified ?? false,
            supportedInterfaces: entry.supportedInterfaces?.split(' ') as SearchResultInterfaces[] ?? [],
            priceUSD: resolvePriceUSD(entry as unknown as SearchResultNFT),
            img: resolveIcon(entry as unknown as SearchResultToken),
        } as SearchResultNFT;
    case 'address':
        return {
            category: 'address',
            type: 'address',
            address: entry.address ?? NULL_ADDRESS,
        } as SearchResultAddress;
    case 'transaction':
        return {
            category: 'transaction',
            type: 'transaction',
            hash: entry.hash ?? NULL_HASH,
        } as SearchResultTrx;
    case 'block':
        return {
            category: 'block',
            type: 'block',
            number: entry.number ?? 0,
        } as SearchResultBlock;
    default:
        return {
            category: 'unknown',
            type: 'unknown',
        } as SearchResultUnknown;
    }
};

const fetchResults = (query: string): SearchResult[] => {
    if (query.length < 3) {
        return [];
    }
    console.log('Fetching results for:', query);
    const url = `https://api.teloscan.io/api?module=search&action=search&query=${query}`;
    axios.get(url).then((response) => {
        console.log('Response:', response);
        return response.data.result.map((entry: SearchResultRaw) => convertRawToProcessedResult(entry));
    }).catch((error) => {
        console.error('Error fetching results:', error);
    });
    return [] as SearchResult[];
};

// Logic to handle autocomplete structure ----
const resolveTabLabel = (category: string): string => {
    let label = $t(`components.header.${category}`);
    return props.homepageMode ? label : label.split(' ')[0];
};

const shouldShowDivider = (index: number): boolean => {
    if (index === 0) {
        return true;
    }
    return searchResults.value[index].category !== searchResults.value[index - 1].category;
};

const extractCategoryList = (): SearchResultCategory[] =>
    searchResults.value.map(entry => entry.category).filter((value, index, self) => self.indexOf(value) === index) as SearchResultCategory[];


// Logic to open / close autocomplete ----

const handleClick = (event: Event): void => {
    console.log('document.addEventListener(click)');
    document.querySelectorAll('.c-search').forEach((element) => {
        if (!element.contains(event.target as Node)) {
            console.log('document.addEventListener(click) CASO 1');
            showAutocomplete.value = false;
            // document.removeEventListener('click', handleClick);
        } else {
            document.querySelectorAll('.c-search__input').forEach((inputEl) => {
                if (inputEl.contains(event.target as Node) && searchTerm.value !== '') {
                    console.log('document.addEventListener(click) CASO 2');
                    showAutocomplete.value = true;
                    // document.addEventListener('click', handleClick);
                }
            });
        }
    });
};

onMounted(() => {
    document.addEventListener('click', handleClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClick);
});

watch(searchTerm, (newValue) => {
    searchResults.value = fetchResults(newValue);
    if (searchTerm.value !== '') {
        showAutocomplete.value = true;
        document.addEventListener('click', handleClick);
    } else {
        showAutocomplete.value = false;
    }
});
</script>

<template>
<div
    :class="{
        'c-search': true,
        'c-search--homepage': homepageMode,
    }"
>
    <q-input
        ref="inputRef"
        v-model="searchTerm"
        dense
        outlined
        class="c-search__input"
        color="black"
        hide-bottom-space
        :placeholder="$t('components.header.search_placeholder')"
        type="search"
        inputmode="search"
    >
        <template v-slot:append>
            <q-icon
                name="search"
                size="24px"
                class="c-search__icon"
                aria-hidden="true"
            />
        </template>
    </q-input>

    <div v-if="showAutocomplete" class="c-search__autocomplete">
        <q-tabs
            v-model="selectedTab"
            class="c-search__tabs"
            active-class="c-search__tabs-tab--active"
            content-class="c-search__tabs-content"
            indicator-color="transparent"
        >
            <q-tab
                v-for="cat in extractCategoryList()"
                :key="cat"
                :name="cat"
                :label="resolveTabLabel(cat)"
                class="c-search__tabs-tab"
            />
        </q-tabs>
        <div class="c-search__results">
            <template
                v-for="(entry, index) in searchResults"
                :key="entry.address"
            >
                <div v-if="shouldShowDivider(index)" class="c-search__result-category-divider"> {{ entry.category }}</div>




            </template>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-search {
    $this: &;

    --color: #{$dark};
    --background-color: white;

    height: 32px;
    width: 100%;
    max-width: 500px;

    @media screen and (min-width: $breakpoint-md-min) {
        width: 400px;
    }

    @media screen and (min-width: $breakpoint-lg-min) {
        width: 500px;
    }

    @at-root .body--dark & {
        --color: white;
        --background-color: #{$dark};
    }

    // quasar overrides
    .q-field--standout,
    .q-field--standout.q-field--highlighted {
        .q-field__native,
        .q-field__append {
            color: var(--color);
        }
    }

    .q-field--dense {
        .q-field__control,
        .q-field__marginal {
            height: 32px;
        }
    }

    .q-field--outlined .q-field__control:before {
        border: 1px solid var(--border-color);
    }

    &--homepage {
        max-width: 800px;
        width: 100%;
        height: 48px;

        #{$this}__icon {
            position: relative;
            display: flex;
            z-index: 1;
            color: white;
            height: 32px;
            width: 32px;

            &::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--q-primary);
                border-radius: 4px;
                z-index: -1;
            }
        }

        .q-field__control {
            &::before {
                border-radius: 8px;
                background-color: var(--background-color);
                box-shadow:
                    0 1px 5px rgba(0, 0, 0, 0.2),
                    0 2px 2px rgba(0, 0, 0, 0.14),
                    0 3px 1px -2px rgba(0, 0, 0, 0.12)
            }

            &::after {
                border-radius: 8px;
            }
        }

        .q-field--dense {
            .q-field__control,
            .q-field__marginal {
                height: 48px;
            }
        }

        .q-field--outlined .q-field__control:before {
            border: none;
        }

        .q-field--outlined.q-field--highlighted .q-field__control::after {
            border-color: var(--q-primary);
        }
    }

    &__icon {
        cursor: pointer;
    }

    // autocomplete styles

    &__autocomplete {
        position: absolute;
        width: 400px;
        #{$this}--homepage & {
            max-width: 800px;
            width: 100vw;
        }
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-top: 4px;
        z-index: 10;
    }

    &__tabs {
        padding: 10px 10px 0px 10px;
        @include tabs-container;
    }

    &__results {
        @include scroll-bar;
        max-height: 50vh;
        overflow-y: auto;
    }

    &__result {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid var(--border-color);

        &--tokens {
            // specific styles for tokens category
        }

        // other categories

        &-icon {
            width: 40px;
            height: 40px;
            margin-right: 8px;
        }

        &-details {
            flex: 1;

            &-title {
                font-weight: bold;
                font-size: 1.1em;
            }

            &-subtitle {
                font-size: 0.9em;
                color: #666;
            }
        }

        &-check {
            color: #4caf50;
        }
    }
}
</style>
