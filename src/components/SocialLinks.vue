<script setup lang="ts">
import InlineSvg from 'vue-inline-svg';
</script>
<template>
<div class="c-social-links">
    <a class="c-social-links__link" href="http://t.me/HelloTelos">
        <InlineSvg
            :src="require('src/assets/icon-social--telegram.svg')"
            class="c-social-links__img c-social-links__img--telegram"
            height="24"
            width="24"
            aria-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            Telegram
        </q-tooltip>
    </a>
    <a class="c-social-links__link" href="https://twitter.com/HelloTelos">
        <InlineSvg
            :src="require('src/assets/icon-social--x-twitter.svg')"
            class="c-social-links__img c-social-links__img--x-twitter"
            height="24px"
            width="24px"
            aira-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            X (Twitter)
        </q-tooltip>
    </a>
    <a class="c-social-links__link" href="https://www.youtube.com/@TheTelosNetwork">
        <InlineSvg
            :src="require('src/assets/icon-social--youtube.svg')"
            class="c-social-links__img c-social-links__img--youtube"
            height="24px"
            width="24px"
            aira-hidden="true"
        />
        <q-tooltip anchor="top middle" self="bottom middle">
            YouTube
        </q-tooltip>
    </a>
    <a class="c-social-links__link" href="https://discord.gg/telos">
        <InlineSvg
            :src="require('src/assets/icon-social--discord.svg')"
            class="c-social-links__img c-social-links__img--discord"
            height="24px"
            width="24px"
            aira-hidden="true"
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
