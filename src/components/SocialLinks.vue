<script setup lang="ts">
import InlineSvg from 'vue-inline-svg';
import { computed, ref, watch } from 'vue';
import { useChainStore } from 'src/core';
import { useRoute } from 'vue-router';

const $route = useRoute();

const socialLinks = ref(useChainStore().currentChain.settings.getSocialLinks());
function updateLinks() {
    socialLinks.value = useChainStore().currentChain.settings.getSocialLinks();
}

// Map of icon names to SVG paths
const iconMap: Record<string, string> = {
    telegram: require('src/assets/icon-social--telegram.svg'),
    twitter: require('src/assets/icon-social--x-twitter.svg'),
    youtube: require('src/assets/icon-social--youtube.svg'),
    discord: require('src/assets/icon-social--discord.svg'),
};

// Create a Set of icon names present in socialLinks
const socialLinkIcons = computed(() => new Set(socialLinks.value.map(link => link.icon)));

// Watch for changes in the chain configuration
watch(() => $route.query.network, () => {
    updateLinks();
});
</script>

<template>
<div class="c-social-links">
    <!-- Telegram -->
    <a
        v-if="socialLinkIcons.has('telegram')"
        href="http://t.me/HelloTelos"
        class="c-social-links__link"
        target="_blank"
    >
        <InlineSvg
            :src="iconMap['telegram']"
            class="c-social-links__img c-social-links__img--telegram"
            height="24"
            width="24"
            aria-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            Telegram
        </q-tooltip>
    </a>
    <!-- Twitter -->
    <a
        v-if="socialLinkIcons.has('twitter')"
        href="https://twitter.com/HelloTelos"
        class="c-social-links__link"
        target="_blank"
    >
        <InlineSvg
            :src="iconMap['twitter']"
            class="c-social-links__img c-social-links__img--x-twitter"
            height="24"
            width="24"
            aria-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            X (Twitter)
        </q-tooltip>
    </a>
    <!-- YouTube -->
    <a
        v-if="socialLinkIcons.has('youtube')"
        href="https://www.youtube.com/@TheTelosNetwork"
        class="c-social-links__link"
        target="_blank"
    >
        <InlineSvg
            :src="iconMap['youtube']"
            class="c-social-links__img c-social-links__img--youtube"
            height="24"
            width="24"
            aria-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            YouTube
        </q-tooltip>
    </a>
    <!-- Discord -->
    <a
        v-if="socialLinkIcons.has('discord')"
        href="https://discord.gg/telos"
        class="c-social-links__link"
        target="_blank"
    >
        <InlineSvg
            :src="iconMap['discord']"
            class="c-social-links__img c-social-links__img--discord"
            height="24"
            width="24"
            aria-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            Discord
        </q-tooltip>
    </a>
</div>
</template>

<style lang="scss">
.c-social-links {
    flex-direction: row;
    justify-content: flex-end;
    display: flex;

    &__link {
        display: inline-block;
        margin-right: 1rem;
    }

    &__img {
        .st0 {
            fill: var(--grey-text-color);
        }
        .st1 {
            fill: var(--invert-text-color);
        }
        &:hover {
            .st0 {
                fill: var(--text-color);
            }
        }
    }
}
</style>
