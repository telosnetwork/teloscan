<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { evm } from 'src/boot/evm';


const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

const TIME_DELAY = 6000;

// data
const searchTerm = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// methods
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
}
</script>

<template>
<div class="c-search">
    <!-- eztodo i18n on aria label above -->
    <q-input
        ref="inputRef"
        v-model="searchTerm"
        dense
        outlined
        color="black"
        hide-bottom-space
        :placeholder="$t('components.header.search_placeholder')"
        @keydown.enter="search"
    >
        <template v-slot:append>
            <q-icon
                v-if="!searchTerm"
                name="search"
                size="24px"
                @click="() => inputRef?.focus()"
            />
            <q-icon
                v-else
                name="clear"
                size="24px"
                @click="searchTerm = ''"
            />
        </template>
    </q-input>
</div>
</template>

<style lang="scss">
.c-search {
    --color: #{$dark};
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
    }

    // quasar overrides
    .q-field--standout,
    .q-field--standout.q-field--highlighted {
        .q-field__native,
        .q-field__append {
            color: var(--color);
        }
    }

    .q-field--dense .q-field__control,
    .q-field--dense .q-field__marginal {
        height: 32px;
    }

    .q-field--outlined .q-field__control:before {
        border: 1px solid var(--border-color);
    }
}
</style>
