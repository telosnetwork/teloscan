<script>
import { mapGetters, mapActions } from "vuex";

export default {
    data() {
        return { showLogin: false, error: null };
    },
    computed: {
        ...mapGetters("account", [
            "isAuthenticated",
            "accountName",
            "loading",
            "isAutoLoading"
        ])
    },
    async mounted() {
        await this.autoLogin(this.$route.query.returnUrl);
    },
    methods: {
        ...mapActions("account", ["login", "logout", "autoLogin"]),
        async onLogin(idx) {
            this.error = null;
            const error = await this.login({ idx });
            if (!error) {
                this.showLogin = false;
            } else {
                this.error = error;
            }
        },
        openUrl(url) {
            window.open(url);
        },
        goToAccountPage() {
            const accountPath = `/account/${this.accountName}`;
            if (this.$router.currentRoute.path !== accountPath) {
                this.$router.push({ path: accountPath });
            }
        }
    },
};
</script>

<template lang='pug'>
  div
    .q-px-md( v-if="!isAuthenticated" )
      q-btn(
        @click="showLogin = true"
        color="secondary"
        text-color="black"
        label="Login"
      )
    </div>
    .q-px-md.row( v-if="isAuthenticated" )
      .account-name.q-px-md( @click="goToAccountPage" )
        | {{ accountName }}
      q-btn(
        @click="logout"
        color="secondary"
        text-color="black"
        label="Logout"
      )
    q-dialog( v-model="showLogin" )
      q-list
        q-item(
          v-for="(wallet, idx) in $ual.authenticators"
          :key="wallet.getStyle().text"
          v-ripple
          :style="{
            background: wallet.getStyle().background,
            color: wallet.getStyle().textColor
          }"
        )
          q-item-section.cursor-pointer( avatar @click="onLogin(idx)" )
            img( :src="wallet.getStyle().icon" width="30" )
          q-item-section.cursor-pointer( @click="onLogin(idx)" )
            | {{ wallet.getStyle().text }}
          q-item-section.flex( avatar )
            q-spinner(
              v-if="loading === wallet.getStyle().text"
              :color="wallet.getStyle().textColor"
              size="2em"
            )
            q-btn(
              v-else
              :color="wallet.getStyle().textColor"
              icon="get_app"
              @click="openUrl(wallet.getOnboardingLink())"
              target="_blank"
              dense
              flat
              size="12px"
            )
              q-tooltip
                | Get app
        q-item(
          v-if="error"
          :active="!!error"
          active-class="bg-red-1 text-grey-8"
        )
          q-item-section {{ error }}
</template>

<style lang="sass" scoped>
.account-name
  color: "white"
  font-size: 20px
</style>
