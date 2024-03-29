<script setup lang="ts">

import { LatestContainerOptions } from 'src/types';
import { ref, computed } from 'vue';

const props = defineProps<{
  options: LatestContainerOptions
}>();

const selectedOption = ref<string>(Object.keys(props.options)[0]);

const selectOption = (option: string) => {
    selectedOption.value = option;
};

// only show the customize button if there are more than 1 options
const showCustomize = computed(() => Object.keys(props.options).length > 1);

</script>

<template>
<q-card class="c-latest-data">

    <q-item class="c-latest-data__header">
        <q-item-section class="c-latest-data__header-title">{{ props.options[selectedOption].title }}</q-item-section>
        <q-item-section avatar class="c-latest-data__header-customize">
            <q-btn
                v-if="showCustomize"
                no-caps
                flat
                bordered
                dense
                small
                icon="dashboard"
                label="Customize"
            >
                <q-menu
                    auto-close
                    class="c-latest-data__menu"
                    anchor="bottom right"
                    self="top right"
                >
                    <template v-for="(option, key) in props.options" :key="key">
                        <q-item class="c-latest-data__menu-opt" clickable @click="selectOption(key.toString())">
                            <q-item-section side>
                                <q-icon
                                    name="check"
                                    :class="{
                                        'c-latest-data__menu-opt-check': true,
                                        'c-latest-data__menu-opt-check--active': selectedOption === key.toString()
                                    }"
                                />
                            </q-item-section>
                            <q-item-section no-wrap>{{ option.title }}</q-item-section>
                        </q-item>
                    </template>
                </q-menu>
            </q-btn>
        </q-item-section>
    </q-item>

    <q-separator />

    <q-card-section class="c-latest-data__content">
        <template v-for="(name, key) in props.options" :key="key">
            <slot v-if="selectedOption === key.toString()" :name="key"></slot>
        </template>
    </q-card-section>

    <q-card-actions
        align="center"
        class="c-latest-data__footer"
    >
        <router-link class="c-latest-data__footer-container" :to="{ name: props.options[selectedOption].link }">
            <span class="c-latest-data__footer-text"> {{ props.options[selectedOption].footer }} </span>
            <q-icon name="arrow_forward" class="c-latest-data__footer-icon" />
        </router-link>
    </q-card-actions>

</q-card>

</template>

<style lang="scss">
.c-latest-data {

    height: 528px;

    &__header {
        &-title {
            font-weight: 600;
            font-size: 0.9rem;
        }
    }

    &__content {
        overflow-y: auto;
        @include scroll-bar;
    }

    &__menu-opt-check {
        opacity: 0;
        &--active {
            opacity: 1;
        }
    }

    &__footer {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        cursor: pointer;
        display: flex;
        gap: 5px;
        background-color: color-mix(in srgb, white, black 5%);

        &-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        body.body--dark & {
            background-color: color-mix(in srgb, $dark, white 5%);
        }

        &-text {
            font-size: 0.7rem;
            text-transform: uppercase;
        }
        &:hover {
            color: var(--q-primary);
        }
    }
}

@media screen and (max-width: $latest-data-breakpoint) {
    .c-latest-data {
        height: fit-content;
    }
}
</style>
