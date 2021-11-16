<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          Telos Vue/Quasar App Template
        </q-toolbar-title>

        <login-button></login-button>
        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-list>
        <q-item-label header class="text-grey-8">
          Example pages
        </q-item-label>
        <ExamplePage
          v-for="link in examplePages"
          :key="link.title"
          v-bind="link"
        />
        <q-item-label header class="text-grey-8">
          Essential Links
        </q-item-label>
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from "components/EssentialLink.vue";
import ExamplePage from "components/ExamplePage.vue";
import LoginButton from "components/LoginButton.vue";

const pagesData = [
  {
    title: "Account",
    caption: "Account profile and Hyperion history query example",
    icon: "face",
    path: "/account/exampleuser1"
  },
  {
    title: "Transfer",
    caption: "Transfer example, sending/signing actions",
    icon: "send",
    path: "/transfer"
  },
  {
    title: "Streaming",
    caption: "Hyperion event streaming example",
    icon: "filter_alt",
    path: "/streaming"
  }
];

const linksData = [
  {
    title: "Use this template!",
    caption: "github.com/telosnetwork/ui-template",
    icon: "fas fa-rocket",
    link: "https://github.com/telosnetwork/ui-template"
  },{
    title: "Telos Github",
    caption: "github.com/telosnetwork",
    icon: "fab fa-github",
    link: "https://github.com/telosnetwork"
  },
  {
    title: "Telos Docs",
    caption: "docs.telos.net",
    icon: "menu_book",
    link: "https://docs.telos.net"
  },
  {
    title: "Telos Dev Telegram",
    caption: "t.me/dappstelos",
    icon: "code",
    link: "https://t.me/dappstelos"
  },
  {
    title: "Telos Testnet Faucet",
    caption: "app.telos.net/testnet/developers",
    icon: "opacity",
    link: "https://app.telos.net/testnet/developers"
  },
  {
    title: "Quasar Docs",
    caption: "quasar.dev",
    icon: "school",
    link: "https://quasar.dev"
  },
  {
    title: "Quasar Awesome",
    caption: "Community Quasar projects",
    icon: "favorite",
    link: "https://awesome.quasar.dev"
  }
];

export default {
  name: "MainLayout",
  components: { EssentialLink, ExamplePage, LoginButton },
  data() {
    return {
      leftDrawerOpen: false,
      essentialLinks: linksData,
      examplePages: pagesData
    };
  }
};
</script>
