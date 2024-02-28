<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { copyToClipboard, useQuasar } from 'quasar';
import { BigNumber } from 'ethers/lib/ethers';
import { formatUnits } from 'ethers/lib/utils';

import { truncateAddress } from 'src/antelope/wallets/utils/text-utils';
import { useAccountStore } from 'src/antelope';
import { indexerApi } from 'src/boot/telosApi';
import { WEI_PRECISION } from 'src/antelope/wallets/utils';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { isTestnet } from 'src/lib/chain-utils';

import LoginModal from 'components/LoginModal.vue';
import OutlineButton from 'components/OutlineButton.vue';

const $router = useRouter();
const $store = useStore();
const $i18n = useI18n();
const $q = useQuasar();

// data
const showLoginModal = ref(false);
const userSystemTokenBalanceWei = ref('0');

// computed
const isLoggedIn = computed(() => $store.getters['login/isLoggedIn']);
const isNative = computed(() => $store.getters['login/isNative']);
const address = computed(() => $store.getters['login/address']);
const nativeAccount = computed(() => $store.getters['login/nativeAccount']);
const prettySystemTokenBalance = computed(() =>
    prettyPrintCurrency(
        BigNumber.from(userSystemTokenBalanceWei.value),
        4,
        $i18n.locale.value,
        false,
        'TLOS',
        false,
        WEI_PRECISION,
        false,
    ),
);
const prettyIdentity = computed(() => {
    if (!isLoggedIn.value) {
        return '';
    }

    if (isNative.value) {
        return nativeAccount.value;
    }

    return truncateAddress(address.value);
});
const prettySystemTokenBalanceFiat = computed(() => {
    if (isTestnet()) {
        return '';
    }
    const price = Number($store.getters['chain/tlosPrice']);
    const userBalance = Number(formatUnits(userSystemTokenBalanceWei.value, WEI_PRECISION));
    return (price * userBalance).toFixed(2);
});

// watchers
watchEffect(() => {
    if (isLoggedIn.value) {
        fetchUserBalance();
    }
});

// methods
function handleWalletButtonClick() {
    if (!isLoggedIn.value) {
        showLoginModal.value = true;
    }
}

function logout() {
    useAccountStore().logout();
}

function goToAccountPage() {
    $router.push({
        name: 'address',
        params: {
            address: address.value,
        },
    });
}

function copyAddress() {
    copyToClipboard(address.value);

    $q.notify({
        position: 'bottom',
        message: $i18n.t('components.header.address_copied'),
        color: 'green',
    });
}

async function fetchUserBalance() {
    const response = await indexerApi.get(
        `/account/${address.value}/balances?contract=___NATIVE_CURRENCY___&includeAbi=true`,
    );
    userSystemTokenBalanceWei.value = response.data?.results?.[0]?.balance ?? '0';
}
</script>

<template>
<OutlineButton
    text-color="default"
    class="c-app-header-wallet__main-button"
    v-bind="$attrs"
    @click="handleWalletButtonClick"
>
    <template v-if="!isLoggedIn">
        {{ $t('components.header.connect_wallet') }}

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
                <q-item>
                    <div class="c-app-header-wallet__account-actions-container">
                        <div>
                            <OutlineButton
                                text-color="primary"
                                :icon-only="true"
                                :aria-label="$i18n.t('components.header.copy_address')"
                                @click="copyAddress"
                            >
                                <q-icon name="far fa-copy" size="14px" />

                                <q-tooltip>
                                    {{ $i18n.t('components.header.copy_address') }}
                                </q-tooltip>
                            </OutlineButton>

                            <OutlineButton
                                text-color="primary"
                                :icon-only="true"
                                class="q-ml-sm"
                                @click="goToAccountPage"
                            >
                                <q-icon name="far fa-address-card" size="14px" />

                                <q-tooltip>
                                    {{ $i18n.t('components.header.goto_address_details') }}
                                </q-tooltip>
                            </OutlineButton>
                        </div>

                        <OutlineButton
                            text-color="negative"
                            :icon-only="true"
                            class="q-ml-sm"
                            @click="logout"
                        >
                            <q-icon name="fas fa-power-off" size="14px" />

                            <q-tooltip>
                                {{ $t('components.header.disconnect_wallet_tooltip') }}
                            </q-tooltip>
                        </OutlineButton>
                    </div>
                </q-item>

                <q-separator />

                <q-item>
                    <div>
                        <span class="text-h6 text-weight-bolder">
                            {{ prettySystemTokenBalance }}
                        </span>
                        &nbsp;
                        <span v-if="prettySystemTokenBalanceFiat" class="text-caption">
                            ${{ prettySystemTokenBalanceFiat }}
                        </span>
                    </div>
                </q-item>
            </q-list>
        </q-menu>
    </template>
</OutlineButton>

<LoginModal :show="showLoginModal" @hide="showLoginModal = false" />
</template>

<style lang="scss">
.c-app-header-wallet {
    // CSS variables defined in AppHeader.vue

    &__main-button {
        // quasar overrides
        .q-btn__content {
            font-size: 0.8rem;
            font-weight: 600;
        }
    }

    &__circle-icon {
        margin-left: 8px;
        color: var(--grey-text-color);

        &--logged-in {
            color: $green;
        }
    }

    &__account-actions-container {
        display: flex;
        width: 100%;
        justify-content: space-between;
    }
}
</style>
