<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toChecksumAddress } from 'src/lib/utils';
import { TokenList } from 'src/types';
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
import { useRouter } from 'vue-router';
import { contractManager } from 'src/boot/telosApi';

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
const loading = ref<boolean>(false);
const tokenList = ref<TokenList | null>(null);
const selectedIndex = ref(-1);
const scrolling = ref(false);
const handlingKeyDown = ref(false);

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
    const knownToken = tokenList.value?.tokens.find(token => token.address === entry.address);
    if (knownToken) {
        return knownToken.logoURI;
    } else {
        return 'assets/logo--teloscan.png';
    }
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
    case 'nft': {
        const interfaces = entry.supportedInterfaces ?? '';
        let nftType = '';
        if (interfaces.includes('erc721')) {
            nftType = 'ERC-721';
        } else if (interfaces.includes('erc1155')) {
            nftType = 'ERC-1155';
        }
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
            nftType,
        } as SearchResultNFT;
    }
    case 'address':
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

const sortCriteria = (a: SearchResult, b: SearchResult): number => {
    const aIndex = SearchResultCategories.indexOf(a.category);
    const bIndex = SearchResultCategories.indexOf(b.category);
    const categorySort = aIndex - bIndex;
    if (categorySort === 0) {
        // same category
        if (a.category === 'token' && b.category === 'token') {
            // If they are tokens, sort by known tokens first
            const aKnown = tokenList.value?.tokens.find(token => token.address === a.address) ? 1 : 0;
            const bKnown = tokenList.value?.tokens.find(token => token.address === b.address) ? 1 : 0;
            if (aKnown && bKnown) {
                // if both are known tokens, sort by price
                return (b as SearchResultToken).price - (a as SearchResultToken).price;
            } else {
                // if one is known and the other is unknown, sort by known first
                return bKnown - aKnown;
            }
        } else {
            // if any of the two has a 'null' or empty '' name, put it at the end
            const aRaw = a as SearchResultRaw;
            const bRaw = b as SearchResultRaw;
            if (aRaw.name === '' || aRaw.name === null) {
                return 1;
            } else if (bRaw.name === '' || bRaw.name === null) {
                return -1;
            } else {
                // if any of the two has a 'null' or empty '' symbol, put it at the end
                if (aRaw.symbol === '' || aRaw.symbol === null) {
                    return 1;
                } else if (bRaw.symbol === '' || bRaw.symbol === null) {
                    return -1;
                }
                return 0;
            }
        }
    } else {
        return categorySort;
    }
};

const goToFirstResultNow = (query: string) => {
    const endpoint = process.env.EXPORT_API_ENDPOINT as string;
    // When merging with Crosschain support (https://github.com/telosnetwork/teloscan/pull/769)
    // use the following line instead:
    // const endpoint = useChainStore().currentChain.settings.getIndexerApiEndpoint();
    const url = `${endpoint}/api?module=search&action=search&query=${query}&offset=1`;
    loading.value = true;
    axios.get(url).then((response) => {
        const result = response.data.result.map((entry: SearchResultRaw) => convertRawToProcessedResult(entry));
        loading.value = false;
        handleResultClick(result[0]);
    }).catch((error) => {
        console.error('Error fetching results:', error);
        loading.value = false;
    });
};

const fetchResults = (query: string): Observable<SearchResult[]> => {
    if (query.length < 3) {
        return of([] as SearchResult[]);
    }
    const endpoint = process.env.EXPORT_API_ENDPOINT as string;
    // When merging with Crosschain support (https://github.com/telosnetwork/teloscan/pull/769)
    // use the following line instead:
    // const endpoint = useChainStore().currentChain.settings.getIndexerApiEndpoint();
    const url = `${endpoint}/api?module=search&action=search&query=${query}&offset=50`;
    return new Observable<SearchResult[]>((observer) => {
        loading.value = true;
        axios.get(url).then((response) => {
            const result = response.data.result.map((entry: SearchResultRaw) => convertRawToProcessedResult(entry));
            result.sort(sortCriteria);
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
    let accepted = true;
    if (result.category === 'address') {
        accepted = result.address === toChecksumAddress(result.address);
    }
    if (accepted) {
        return accepted;
    } else {
        console.warn('Filtering out:', result);
    }
});

// Logic to open / close / scroll autocomplete ----
const ensureSelectedIsVisible = () => {
    setTimeout(() => {
        const resultsContainer = document.querySelector('.c-search__results');
        if (!resultsContainer) {
            return;
        }

        const selectedElement = resultsContainer.querySelector('.c-search-result-entry--selected');
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        updateSelectedTab();
    }, 0);
};

let keyDownTimeOut = setTimeout(() => {/**/}, 0);
const handlingKeyDownTimeOut = () => {
    clearTimeout(keyDownTimeOut);
    keyDownTimeOut = setTimeout(() => {
        handlingKeyDown.value = false;
    }, 1000);
};

const handleKeydown = (event: KeyboardEvent) => {
    if (!showAutocomplete.value) {
        // If the autocomplete is not shown yet and the user presses Enter, we should query instantly the first result and navigate to it
        if (event.key === 'Enter') {
            goToFirstResultNow(searchTerm.value);
        }
        return;
    }

    switch (event.key) {
    case 'ArrowDown':
        if (selectedIndex.value < searchResults.value.length - 1) {
            selectedIndex.value++;
            handlingKeyDown.value = true;
            handlingKeyDownTimeOut();
            ensureSelectedIsVisible();
        }
        break;
    case 'ArrowUp':
        if (selectedIndex.value > 0) {
            selectedIndex.value--;
            handlingKeyDown.value = true;
            handlingKeyDownTimeOut();
            ensureSelectedIsVisible();
        }
        break;
    case 'Enter':
        if (selectedIndex.value === -1 && searchResults.value.length > 0) {
            selectedIndex.value = 0;
        }
        if (selectedIndex.value !== -1) {
            handleResultClick(searchResults.value[selectedIndex.value]);
        }
        break;
    case 'Escape':
        showAutocomplete.value = false;
        break;
    default:
        break;
    }
};

const selectCategory = (category: string) => {
    const resultsContainer = document.querySelector('.c-search__results');
    const divider = document.querySelector(`.c-search__result-category-divider--${category}`);
    if (divider && resultsContainer) {
        const dividerOffset = divider.getBoundingClientRect().top - resultsContainer.getBoundingClientRect().top;
        const currentScroll = resultsContainer.scrollTop;
        const scrollTo = currentScroll + dividerOffset;

        // set scrolling flag to avoid conflicting with mouse scroll
        scrolling.value = true;
        // scroll to the selected category
        resultsContainer.scrollTo({
            top: scrollTo,
            behavior: 'smooth',
        });

        // wait for the scroll to finish to restore the scrolling flag
        setTimeout(() => {
            scrolling.value = false;
        }, 1500);


        // we should select the first element of the category which is the next sibling of the divider and extract the index from the class
        const nextSibling = divider.nextElementSibling;
        if (nextSibling) {
            const correctClass = [...nextSibling.classList].find((className: string) => className.startsWith('c-search__result-entry--index-')) ?? '';
            const index = correctClass.split('index-')[1];
            selectedIndex.value = parseInt(index);

            // finally we force the input to focus to avoid the next keydown event to scroll the page
            inputRef.value?.$el.focus();
        }
    }
};

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

const updateSelectedTab = () => {
    const resultsContainer = document.querySelector('.c-search__results');
    if (!resultsContainer || scrolling.value) {
        return;
    }

    if (!handlingKeyDown.value) {
        // The user is scrolling with the mouse, so we need to update the selected tab based on the visible category divider
        const dividers = document.querySelectorAll('.c-search__result-category-divider');
        const containerTop = resultsContainer.getBoundingClientRect().top;
        const candidate = {
            top: -Infinity,
            divider: null as Element | null,
        };
        for (const divider of dividers) {
            const dividerTop = divider.getBoundingClientRect().top;
            if (dividerTop < containerTop && dividerTop > candidate.top) {
                candidate.top = dividerTop;
                candidate.divider = divider;
            }
        }
        if (candidate.divider) {
            const category = candidate.divider.classList[1].split('--')[1]; // Extract category from class
            if (category !== selectedTab.value) {
                selectedTab.value = category;
            }
        }
        // we should unselect whatever is selected avoid conflicting with mouse rollover effect
        selectedIndex.value = -1;

    } else {
        // The user is using the keyboard, so we need to update the selected tab based on the selected result
        const selectedElement = resultsContainer.querySelector('.c-search-result-entry--selected');
        if (selectedElement) {
            const category = selectedElement.classList[1].split('--')[1]; // Extract category from class
            if (category !== selectedTab.value) {
                selectedTab.value = category;
            }
        }
    }
};

onMounted(async () => {
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

    tokenList.value = await contractManager.getTokenList();
});

onBeforeUnmount(() => {
    // Remove click listener
    document.removeEventListener('click', handleClick);
});

watch(showAutocomplete, (newValue) => {
    if (!newValue) {
        // reset selected index
        selectedIndex.value = -1;
    } else {
        // The autocomplete is shown, so we select the first tab
        selectedTab.value = searchResults.value.length > 0 ? searchResults.value[0].category : 'tokens';
    }
});

watch(searchResults, () => {
    if (showAutocomplete.value && searchResults.value.length > 0) {
        const resultsContainer = document.querySelector('.c-search__results');
        if (resultsContainer) {
            fromEvent(resultsContainer, 'scroll').pipe(
                debounceTime(100),
            ).subscribe(updateSelectedTab);
        } else {
            console.error('resultsContainer not found');
        }
    }
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
        @keydown="handleKeydown"
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

    <div
        v-if="showAutocomplete"
        class="c-search__autocomplete"
        tabindex="0"
        @keydown="handleKeydown"
    >
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
                @click="selectCategory(cat)"
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
                > {{ resolveTabLabel(entry.category) }}</div>
                <AppSearchResultEntry
                    :class="['c-search__result-entry', `c-search__result-entry--index-${index}`]"
                    :entry="entry"
                    :selected="selectedIndex === index"
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
        padding: 16px 8px 4px 18px;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: .5px;
        color: var(--text-color);
        border-top: 1px solid var(--border-color);
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
        width: 100%;
    }
}
</style>
