<template>
  <q-layout view="lHh Lpr lFf">
      <q-toolbar class="bg-primary glossy text-white">

      <q-toolbar-title>
          <img alt="Telos logo" src="~assets/Teloscan_logo.svg" />
      </q-toolbar-title>

      <q-btn stretch flat class="desktop-only" label="Blocks" />
      <q-separator dark vertical class="desktop-only" />
      <q-btn stretch flat class="desktop-only" label="Transactions" />
      <q-separator dark vertical class="desktop-only" />

      <q-btn-dropdown stretch flat >
        <template v-slot:label>
        <q-avatar flat stretch dense >
        <img alt="Telos logo" src="~assets/telos_acorn.png" />
      </q-avatar>
      </template>
        
      <q-list style="width : 200px">
          <q-item-label header>Network</q-item-label>
          <q-item clickable v-close-popup to="/">
          <q-item-section>
            <q-item-label>Mainnet</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup to="/">
          <q-item-section>
            <q-item-label>Testnet</q-item-label>
          </q-item-section>
        </q-item>
          <q-separator inset spaced />
          <q-item-label header>Blockchain</q-item-label>
          <q-item clickable v-close-popup to="/">
          <q-item-section>
            <q-item-label>Blocks</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup to="/">
          <q-item-section>
            <q-item-label>Transactions</q-item-label>
          </q-item-section>
        </q-item>
        </q-list>
      </q-btn-dropdown>
      
    </q-toolbar>

    <div class="row justify-center items-center">
      <q-page-container class="pageContainer">
        <router-view />
      </q-page-container>
    </div>

  </q-layout>
</template>

<script>
export default {
  name: "MainLayout",
  components: { },
  data() {
    return {
    };
  }
};
</script>

<style scoped>
.pageContainer {
  flex: 0 1 1200px;
  padding: 1rem;
}
</style>
