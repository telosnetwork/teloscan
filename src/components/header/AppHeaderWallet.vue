<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { truncateAddress } from 'src/antelope/wallets/utils/text-utils';
import { useAccountStore } from 'src/antelope';

import LoginModal from 'components/LoginModal.vue';


const $store = useStore();

// data
const showLoginModal = ref(false);

// computed
const isLoggedIn = computed(() => $store.getters['login/isLoggedIn']);
const isNative = computed(() => $store.getters['login/isNative']);
const address = computed(() => $store.getters['login/address']);
const nativeAccount = computed(() => $store.getters['login/nativeAccount']);
const prettyIdentity = computed(() => {
    if (!isLoggedIn.value) {
        return '';
    }

    if (isNative.value) {
        return nativeAccount.value;
    }

    return truncateAddress(address.value);
});

// methods
function handleButtonClick() {
    if (!isLoggedIn.value) {
        showLoginModal.value = true;
    }
}

function logout() {
    useAccountStore().logout();
}
</script>

<template>
<q-btn
    outline
    dense
    no-caps
    :color="$q.dark.isActive ? 'grey-7' : 'grey-5'"
    class="c-app-header-wallet__button"
    size="md"
    @click="handleButtonClick"
>
    <template v-if="!isLoggedIn">
        <!-- eztodo i18n -->

        Connect Wallet
        <q-icon
            name="far fa-circle"
            size="10px"
            class="c-app-header-wallet__circle-icon"
        />
    </template>

    <template v-else>
        {{ prettyIdentity }}
        <q-icon
            name="fas fa-circle"
            size="10px"
            class="c-app-header-wallet__circle-icon c-app-header-wallet__circle-icon--logged-in"
        />
        <q-menu>
            <q-list>
                <q-item v-close-popup clickable>
                    <div class="u-flex--center-y">
                        <q-icon name="far fa-copy" size="14px" class="q-mr-md" />
                        Copy address
                    </div>
                </q-item>
                <q-item v-close-popup clickable>
                    <div class="u-flex--center-y">
                        <q-icon name="far fa-eye" size="14px" class="q-mr-md" />
                        View details
                    </div>
                </q-item>

                <q-separator />

                <q-item v-close-popup clickable @click="logout">
                    <div class="u-flex--center-y">
                        <q-icon name="fas fa-power-off" size="14px" class="q-mr-md" />
                        Disconnect
                    </div>
                </q-item>
            </q-list>
        </q-menu>
    </template>
</q-btn>

<LoginModal :show="showLoginModal" @hide="showLoginModal = false" />
</template>

<style lang="scss">
.c-app-header-wallet {
    // CSS variables defined in AppHeader.vue

    &__button {
        height: var(--button-height);
        padding: 0 12px;

        // quasar overrides
        .q-btn__content {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-color) !important;
        }
    }

    &__circle-icon {
        margin-left: 8px;
        color: var(--grey-text-color);

        &--logged-in {
            color: $green;
        }
    }
}
</style>
