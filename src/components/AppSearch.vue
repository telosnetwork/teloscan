<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toChecksumAddress } from 'src/lib/utils';
import { getSystemBalance } from 'src/lib/balance-utils';

import axios from 'axios';

import AppSearchResultEntry from 'src/components/AppSearchResultEntry.vue';

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
import { Observable, debounceTime, fromEvent, map, of, switchMap, tap } from 'rxjs';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const props = defineProps<{
    homepageMode?: boolean; // if true, the search bar will be styled for placement on the homepage
}>();

const { t: $t } = useI18n();
const router = useRouter();

const NULL_ADDRESS = '0x' + '0'.repeat(40);
const NULL_HASH = '0x' + '0'.repeat(64);
const SearchResultCategories = ['tokens', 'nft', 'contract', 'address', 'transaction', 'block', 'unknown'];

const searchTerm = ref<string>('');
const inputRef = ref<{$el:HTMLInputElement}|null>(null);
const showAutocomplete = ref<boolean>(false);
const searchResults = ref<Array<SearchResult>>([]);
const selectedTab = ref<string>('tokens');
const fiatValue = useStore().getters['chain/tlosPrice'];
const loading = ref<boolean>(false);


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

const fetchBalance = (address: string): void => {
    // This function fetches the balance of the given address in background and updates the search result when the balance is available
    getSystemBalance(address, fiatValue).then((result) => {
        const addressEntry = searchResults.value.find(entry => entry.category === 'address' && entry.address === address) as SearchResultAddress;
        if (addressEntry) {
            addressEntry.balance = $t('pages.tlos_balance', { balance: result?.tokenQty ?? '0' });
        }
    });
};

const convertRawToProcessedResult = (entry: SearchResultRaw): SearchResult => {
    const address = entry.address ?? NULL_ADDRESS;
    switch (resolveCategory(entry)) {
    case 'contract':
        return {
            category: 'contract',
            type: 'contract',
            address,
            name: entry.name ?? '',
            verified: entry.verified ?? false,
            supportedInterfaces: entry.supportedInterfaces?.split(' ') as SearchResultInterfaces[] ?? [],
        } as SearchResultContract;
    case 'tokens':
        return {
            category: 'token',
            type: 'contract',
            address,
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
            address,
            name: entry.name ?? '',
            symbol: entry.symbol ?? '',
            price: entry.price ?? 0,
            verified: entry.verified ?? false,
            supportedInterfaces: entry.supportedInterfaces?.split(' ') as SearchResultInterfaces[] ?? [],
            priceUSD: resolvePriceUSD(entry as unknown as SearchResultNFT),
            img: resolveIcon(entry as unknown as SearchResultToken),
        } as SearchResultNFT;
    case 'address':
        fetchBalance(address); // this line fetches the balance in background
        return {
            category: 'address',
            type: 'address',
            address,
            balance: 'loading',
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

const byCategory = (a: SearchResult, b: SearchResult): number => {
    const aIndex = SearchResultCategories.indexOf(a.category);
    const bIndex = SearchResultCategories.indexOf(b.category);
    return aIndex - bIndex;
};

const fetchResults = (query: string): Observable<SearchResult[]> => {
    if (query.length < 3) {
        return of([] as SearchResult[]);
    }
    const endpoint = process.env.EXPORT_API_ENDPOINT as string;
    // When merging with Crosschain support (https://github.com/telosnetwork/teloscan/pull/769)
    // use the following line instead:
    // const endpoint = useChainStore().currentChain.settings.getIndexerApiEndpoint();
    const url = `${endpoint}/api?module=search&action=search&query=${query}`;
    return new Observable<SearchResult[]>((observer) => {
        loading.value = true;
        axios.get(url).then((response) => {
            const result = response.data.result.map((entry: SearchResultRaw) => convertRawToProcessedResult(entry));
            result.sort(byCategory);
            loading.value = false;
            observer.next(result);
            observer.complete();
        }).catch((error) => {
            console.error('Error fetching results:', error);
            loading.value = false;
            observer.next([] as SearchResult[]);
            observer.complete();
        });
    });
};

// Logic to handle autocomplete structure ----
const resolveTabLabel = (category: string): string => {
    let label = $t(`components.header.category_${category}`);
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

const filterResults = (results: SearchResult[]): SearchResult[] => results.filter((result) => {
    if (result.category === 'address') {
        return result.address === toChecksumAddress(result.address);
    }
    return true;
});



// Logic to open / close / scroll autocomplete ----

watch(selectedTab, (newValue) => {
    const resultsContainer = document.querySelector('.c-search__results');
    const divider = document.querySelector(`.c-search__result-category-divider--${newValue}`);
    if (divider && resultsContainer) {
        const dividerOffset = divider.getBoundingClientRect().top - resultsContainer.getBoundingClientRect().top;
        resultsContainer.scrollTo({
            top: dividerOffset,
            behavior: 'smooth',
        });
    }
});

const handleClick = (event: Event): void => {
    document.querySelectorAll('.c-search').forEach((element) => {
        if (!element.contains(event.target as Node)) {
            showAutocomplete.value = false;
        } else {
            document.querySelectorAll('.c-search__input').forEach((inputEl) => {
                if (inputEl.contains(event.target as Node) && searchTerm.value !== '') {
                    showAutocomplete.value = true;
                }
            });
        }
    });
};

onMounted(() => {
    const input = inputRef.value?.$el;

    if (input) {
        fromEvent(input, 'input').pipe(
            debounceTime(500), // Wait for 0.5 second of inactivity before sending the query
            tap(() => {
                showAutocomplete.value = searchTerm.value.length >= 3;
            }),
            map((event: Event) => (event.target as HTMLInputElement).value),
            switchMap((query: string) =>
                fetchResults(query).pipe(
                    map(results => filterResults(results)),
                ),
            ),
        ).subscribe((results: SearchResult[]) => {
            selectedTab.value = results.length > 0 ? results[0].category : 'tokens';
            searchResults.value = results;
        });
    }

    document.addEventListener('click', handleClick);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClick);
});

// Logic to handle search result click ----
const handleResultClick = (item: SearchResult): void => {
    showAutocomplete.value = false;
    searchTerm.value = '';
    switch (item.category) {
    case 'block':
        router.push({ name: 'block', params: { block: item.number.toString() } });
        break;
    case 'transaction':
        router.push({ name: 'transaction', params: { hash: item.hash } });
        break;
    case 'address':
    case 'contract':
    case 'token':
    case 'nft':
        router.push({ name: 'address', params: { address: item.address } });
        break;
    default:
        console.error('handleResultClick() unknown category:', item.category);
        break;
    }
};

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
        <div
            v-if="loading"
            class="c-search__loading"
        >
            <q-spinner-dots
                color="primary"
                size="24px"
            />
        </div>
        <div
            v-else
            v-show="searchResults.length === 0"
            class="c-search__no-results"
        >{{ $t('components.header.no_results') }}</div>
        <q-tabs
            v-show="searchResults.length > 0"
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
                :key="entry.address ?? entry.hash"
            >
                <div
                    v-if="shouldShowDivider(index)"
                    :class="['c-search__result-category-divider', `c-search__result-category-divider--${entry.category}`]"
                > {{ entry.category }}</div>
                <AppSearchResultEntry
                    :entry="entry"
                    @click="handleResultClick(entry)"
                />
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
        width: 450px;
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

    &__loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
    }

    &__no-results {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
        color: var(--text-color);
    }

    &__result-category-divider {
        padding: 12px 8px 4px 18px;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: .5px;
        color: var(--text-color);
    }

    &__autocomplete {
        position: absolute;
        width: calc(100% - 24px);
        @media screen and (min-width: $breakpoint-md-min) {
            width: 680px;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            width: 730px;
        }
        #{$this}--homepage & {
            max-width: 800px;
            width: 100%;
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
        max-height: 30vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-bottom: 10px;
    }
}
</style>
