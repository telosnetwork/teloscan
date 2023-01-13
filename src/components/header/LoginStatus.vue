<template>
<div class="c-login-status u-flex--center-y" v-if="isLoggedIn">
    <q-icon
        name="account_circle"
        class="c-login-status__account-icon"
        size="sm"
    />
    {{ prettyIdentity }}
    <!--eztodo add tooltips for icons-->
    <!--eztodo close menu (emit event?) on navigate to address page-->
    <q-icon
        name="preview"
        size="sm"
        class="q-px-sm cursor-pointer"
        @click="goToAddress"
    />
    <q-icon
        name="content_copy"
        size="sm"
        class="q-px-sm cursor-pointer"
        @click="copy"
    />
</div>
</template>

<script>
import { copyToClipboard } from 'quasar';
import { mapGetters } from 'vuex';

export default {
    name: 'LoginStatus',
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
            'address',
            'nativeAccount',
        ]),
        prettyIdentity() {
            if (!this.isLoggedIn)
                return '';

            if (this.isNative)
                return this.nativeAccount;

            return `0x...${this.address.slice(38, 42)}`;
        },
    },
    methods: {
        goToAddress() {
            this.$router.push(`/address/${this.address}`);
        },
        copy() {
            copyToClipboard(this.address);
        },
    },
}
</script>

<style lang="scss">
.c-login-status {
    font-size: 18px;

    &__account-icon {
        margin-right: 8px;
    }
}
</style>
