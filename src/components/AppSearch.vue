<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { evm } from 'src/boot/evm';

const props = defineProps<{
    homepageMode?: boolean; // if true, the search bar will be styled for placement on the homepage
}>();

const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

const TIME_DELAY = 6000;

const searchTerm = ref<string>('');
const inputRef = ref<{$el:HTMLInputElement}|null>(null);
const showAutocomplete = ref<boolean>(false);
const searchResults = ref<Array<SearchResultFixed>>([]);
const selectedTab = ref<string>('tokens');

export interface SearchResultEntry {
    symbol: string;
    address: string;
    price: number;
    decimals: number;
    name: string;
    verified: boolean;
    supportedInterfaces: string;
    type: string;
    issuer: string | null;
}

export interface SearchResultFixed {
    symbol: string;
    address: string;
    price: number;
    decimals: number;
    name: string;
    verified: boolean;
    type: string;
    issuer: string | null;
    // fixed properties
    supportedInterfaces: string[];
    priceUSD: string;
    category: string;
    icon: string;
}

console.log($router, $q, TIME_DELAY, evm, axios); // FIXME: remove this line

async function search() {
    /*
    if (!searchTerm.value) {
        return;
    }

    searchTerm.value = searchTerm.value.trim().replace(/\s/, '');
    if (searchTerm.value.startsWith('0x')) {
        if (searchTerm.value.length === 42) {
            $router.push(`/address/${searchTerm.value}`);
            return;
        } else {
            $router.push(`/tx/${searchTerm.value}`);
            return;
        }
    } else if (searchTerm.value.match(/(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/)) {
        try {
            const account = await evm.telos.getEthAccountByTelosAccount(searchTerm.value);
            $router.push(`/address/${account.address}`);
            return;
        } catch (e) {
            // in case this was a block that looked like an account name let's try it as a block
            if (searchTerm.value && /\d+/g.test(searchTerm.value)) {
                $router.push(`/block/${searchTerm.value}`);
                return;
            }

            $q.notify({
                position: 'top',
                message: $t('components.header.address_not_found', { account: searchTerm.value }),
                timeout: TIME_DELAY,
            });
            return;
        }
    } else if (/\d+/g.test(searchTerm.value)) {
        $router.push(`/block/${searchTerm.value}`);
        return;
    }

    $q.notify({
        position: 'top',
        message: $t('components.header.search_failed'),
        timeout: TIME_DELAY,
    });
    */
}


const resolveCategory = (entry: SearchResultEntry): string => {
    if (entry.supportedInterfaces.includes('erc20')) {
        return 'tokens';
    } else if (entry.supportedInterfaces.includes('erc721') || entry.supportedInterfaces.includes('erc721_metadata')) {
        return 'nfts';
    } else if (entry.supportedInterfaces.includes('erc1155')) {
        return 'nfts';
    } else {
        return 'addresses';
    }
};

const resolvePriceUSD = (entry: SearchResultEntry): string => {
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

const resolveIcon = (entry: SearchResultEntry): string => {
    if (entry.type === '') {
        // TODO resolve icon for addresses
        return '';
    } else {
        return 'assets/logo--teloscan.png';
    }
};

const resolveTabLabel = (category: string): string => {
    let label = '';
    switch (category) {
    case 'tokens':
        label = $t('components.header.tokens');
        break;
    case 'nfts':
        label = $t('components.header.nfts');
        break;
    case 'addresses':
        label = $t('components.header.addresses');
        break;
    default:
        return '..';
    }
    // if we are not in homepage split the laben in spaces and return just the first word
    return props.homepageMode ? label : label.split(' ')[0];
};

const shouldShowDivider = (index: number): boolean => {
    if (index === 0) {
        return true;
    }
    return searchResults.value[index].category !== searchResults.value[index - 1].category;
};

// Simulated API call
const fetchResults = (query: string): SearchResultFixed[] => {
    console.log('Fetching results for:', query);
    const hardcodedResults = {
        'status': '200',
        'message': 'OK',
        'result': [
            {
                'symbol': 'BANANA',
                'address': '0x7097Ee02465FB494841740B1a2b63c21Eed655E7',
                'price': 0,
                'decimals': 4,
                'name': 'Banana',
                'verified': true,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': null,
            },
            {
                'symbol': 'DECO',
                'address': '0x7e1cfe10949A6086A28C38aA4A43fDeAB34f198A',
                'price': 0,
                'decimals': 4,
                'name': 'DestinyCoin',
                'verified': true,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': null,
            },
            {
                'symbol': 'KARMA',
                'address': '0x730d2Fa7dC7642E041bcE231E85b39e9bF4a6a64',
                'price': 0,
                'decimals': 18,
                'name': 'CharmDojo',
                'verified': true,
                'supportedInterfaces': 'erc1155',
                'type': 'contract',
                'issuer': null,
            },
            {
                'symbol': 'BTC.b',
                'address': '0x7627b27594bc71e6Ab0fCE755aE8931EB1E12DAC',
                'price': 0,
                'decimals': 8,
                'name': 'Bitcoin',
                'verified': true,
                'supportedInterfaces': 'erc1155',
                'type': 'contract',
                'issuer': 'LayerZero',
            },
            {
                'symbol': 'APPLE',
                'address': '0x1234567890ABCDEF1234567890ABCDEF12345678',
                'price': 100,
                'decimals': 2,
                'name': 'AppleCoin',
                'verified': true,
                'supportedInterfaces': 'erc721,erc721_metadata',
                'type': 'contract',
                'issuer': 'FruitIssuer',
            },
            {
                'symbol': 'ORANGE',
                'address': '0x234567890ABCDEF1234567890ABCDEF123456789',
                'price': 50,
                'decimals': 2,
                'name': 'OrangeToken',
                'verified': false,
                'supportedInterfaces': 'erc721,erc721_metadata',
                'type': 'contract',
                'issuer': 'CitrusIssuer',
            },
            {
                'symbol': 'GRAPE',
                'address': '0x34567890ABCDEF1234567890ABCDEF1234567890',
                'price': 25,
                'decimals': 3,
                'name': 'GrapeCoin',
                'verified': true,
                'supportedInterfaces': '',
                'type': 'contract',
                'issuer': 'VineyardIssuer',
            },
            {
                'symbol': 'PEAR',
                'address': '0x4567890ABCDEF1234567890ABCDEF12345678901',
                'price': 75,
                'decimals': 2,
                'name': 'PearToken',
                'verified': false,
                'supportedInterfaces': '',
                'type': 'contract',
                'issuer': 'OrchardIssuer',
            },
            {
                'symbol': 'PEACH',
                'address': '0x567890ABCDEF1234567890ABCDEF123456789012',
                'price': 30,
                'decimals': 4,
                'name': 'PeachCoin',
                'verified': true,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': null,
            },
            {
                'symbol': 'CHERRY',
                'address': '0x67890ABCDEF1234567890ABCDEF1234567890123',
                'price': 20,
                'decimals': 4,
                'name': 'CherryToken',
                'verified': true,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': 'BerryIssuer',
            },
            {
                'symbol': 'MANGO',
                'address': '0x7890ABCDEF1234567890ABCDEF12345678901234',
                'price': 60,
                'decimals': 2,
                'name': 'MangoCoin',
                'verified': false,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': 'TropicalIssuer',
            },
            {
                'symbol': 'PLUM',
                'address': '0x890ABCDEF1234567890ABCDEF123456789012345',
                'price': 40,
                'decimals': 3,
                'name': 'PlumToken',
                'verified': true,
                'supportedInterfaces': 'erc20',
                'type': 'contract',
                'issuer': 'StoneFruitIssuer',
            },
        ],
    };

    // we need to fix all raw properties before returning
    const fixed = (hardcodedResults.result as SearchResultEntry[]).map((entry: SearchResultEntry) => ({
        ...entry,
        supportedInterfaces: entry.supportedInterfaces.split(','),
        category: resolveCategory(entry),
        priceUSD: resolvePriceUSD(entry),
        icon: resolveIcon(entry),
    }) as SearchResultFixed);

    // we sort the results by category: tokens, nfts, addresses
    return fixed.sort((a, b) => {
        if (a.category === b.category) {
            return a.name.localeCompare(b.name);
        } else {
            switch (a.category) {
            case 'tokens':
                return -1;
            case 'nfts':
                return b.category === 'tokens' ? 1 : -1;
            case 'addresses':
                return 1;
            default:
                return 0;
            }
        }
    });
};

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
    // if (inputRef.value) {
    //     console.log('inputRef.value.$el.addEventListener(focus)');
    //     inputRef.value.$el.addEventListener('focus', handleClick);
    // } else {
    //     console.log('inputRef.value is null');
    // }
    // document.querySelectorAll('.c-search__input').forEach((element) => {
    //     console.log('(.c-search__input).addEventListener(focus)');
    //     element.addEventListener('focus', function() {
    //         console.log('element.addEventListener(focus)');
    //         showAutocomplete.value = true;
    //         document.addEventListener('click', handleClick);
    //     });
    // });
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClick);
    // // if (inputRef.value) {
    // //     inputRef.value.$el.removeEventListener('focus', handleClick);
    // // }
    // document.querySelectorAll('.c-search__input').forEach((element) => {
    //     element.removeEventListener('focus', handleClick);
    // });
});

// Watch searchTerm and fetch results
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
        @keydown.enter="search"
    >
        <template v-slot:append>
            <q-icon
                name="search"
                size="24px"
                class="c-search__icon"
                aria-hidden="true"
                @click="search"
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
                name="tokens"
                class="c-search__tabs-tab"
                :label="resolveTabLabel('tokens')"
            />
            <q-tab
                name="nfts"
                class="c-search__tabs-tab"
                :label="resolveTabLabel('nfts')"
            />
            <q-tab
                name="addresses"
                class="c-search__tabs-tab"
                :label="resolveTabLabel('addresses')"
            />
        </q-tabs>
        <div class="c-search__results">
            <template
                v-for="(entry, index) in searchResults"
                :key="entry.address"
            >
                <div v-if="shouldShowDivider(index)" class="c-search__result-category-divider"> {{ entry.category }}</div>
                <div :class="['c-search__result', 'c-search__result--' + entry.category]">
                    <img :src="entry.icon" alt="" class="c-search__result-icon">
                    <div class="c-search__result-details">
                        <div class="c-search__result-title">
                            {{ entry.name }}
                            <span v-if="entry.price > 0" class="c-search__result-title-price">{{ entry.priceUSD }}</span>
                        </div>
                        <div class="c-search__result-subtitle">{{ entry.address }}</div>
                    </div>
                    <q-icon name="check" class="c-search__result-check" aria-hidden="true"/>
                </div>
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
    // FIXME: remove this comment
    //     display: flex;
    //     background:  var(--background-color);
    //     border-bottom: 1px solid var(--border-color);
    // }
    // &__tab {
    //     flex: 1;
    //     padding: 8px;
    //     text-align: center;
    //     cursor: pointer;
    //     border: none;
    //     background: none;
    //     outline: none;
    //     &--selected {
    //         background: #ddd;
    //     }
    // }

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
