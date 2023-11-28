<script>
import { copyToClipboard } from 'quasar';
import { mapGetters } from 'vuex';

export default {
    name: 'LoginStatus',
    emits: ['navigated'],
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
            'address',
            'nativeAccount',
        ]),
        prettyIdentity() {
            if (!this.isLoggedIn) {
                return '';
            }

            if (this.isNative) {
                return this.nativeAccount;
            }

            return `${this.address.slice(0, 6)}...${this.address.slice(38, 42)}`;
        },
    },
    methods: {
        goToAddress() {
            this.$emit('navigated');
            this.$router.push(`/address/${this.address}`);
        },
        copy() {
            copyToClipboard(this.address);

            this.$q.notify({
                position: 'bottom',
                message: this.$t('components.header.address_copied'),
                color: 'green',
            });
        },
    },
};
</script>

<template>
<div v-if="isLoggedIn" class="c-login-status u-flex--center-y">
    <q-icon
        name="account_circle"
        class="c-login-status__account-icon"
        size="sm"
    />
    {{ prettyIdentity }}
    <div class="u-flex--center">
        <q-icon
            name="preview"
            size="sm"
            class="q-px-sm cursor-pointer"
            @click="goToAddress"
        />
        <q-tooltip>
            {{ $t('components.header.goto_address_details') }}
        </q-tooltip>
    </div>

    <div class="u-flex--center">
        <q-icon
            name="content_copy"
            size="sm"
            class="q-px-sm cursor-pointer"
            @click="copy"
        />
        <q-tooltip>
            {{ $t('components.header.copy_address') }}
        </q-tooltip>
    </div>
</div>
</template>

<style lang="scss">
.c-login-status {
    font-size: 18px;

    &__account-icon {
        margin-right: 8px;
    }
}
</style>
