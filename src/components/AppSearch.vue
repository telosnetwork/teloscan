<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useChainStore } from 'src/antelope';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

defineProps<{
    homepageMode?: boolean; // if true, the search bar will be styled for placement on the homepage
}>();

const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

const TIME_DELAY = 6000;

const searchTerm = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

async function search() {
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
            const chain = useChainStore().currentChain;
            const address = await chain.settings.getEthAccountByNativeAccount(searchTerm.value);
            $router.push(`/address/${address}`);
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
}
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
}
</style>
