<template>
<div class="c-login-status u-flex--center-y" v-if="isLoggedIn">
    <q-icon
        name="account_circle"
        class="c-login-status__account-icon"
        size="sm"
    />
    0x...3c3c
    <q-icon
        name="preview"
        size="sm"
        class="q-px-sm"
    />
    <q-icon
        name="content_copy"
        size="sm"
        class="q-px-sm"
    />
</div>
</template>

<script>
// import { mapGetters } from 'vuex';

export default {
    name: 'LoginStatus',
    props: {
        isLoggedIn: {
            type: Boolean,
            default: false,
        },
    },
    // computed: {
    //     ...mapGetters('login', [
    //         'isLoggedIn',
    //     ]),
    // },
    // getLoginDisplay() {
    //     if (this.isLoggedIn)
    //        return this.isNative ? this.nativeAccount : this.address;
    // },
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
