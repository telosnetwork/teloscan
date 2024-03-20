<script setup lang="ts">
import { LatestContainerOptions } from 'src/types';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';


const router = useRouter();

const props = defineProps<{
  options: LatestContainerOptions
}>();

const selectedOption = ref(Object.keys(props.options)[0]);

const selectOption = (option: string) => {
    selectedOption.value = option;
};

const goToPage = (link: string) => {
    router.push({ name: link });
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
                                        'c-latest-data__menu-opt-check--active': selectedOption === key
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
            <slot v-if="selectedOption === key" :name="key"></slot>
        </template>
    </q-card-section>


    <q-card-actions align="center" class="c-latest-data__footer" @click="goToPage(props.options[selectedOption].link)">
        <span class="c-latest-data__footer-text"> {{  props.options[selectedOption].footer  }} </span>
        <q-icon name="arrow_forward" class="c-latest-data__footer-icon" />
    </q-card-actions>

</q-card>

</template>

<style lang="scss">
.c-latest-data {
    border-radius: 12px;
    height: 550px;
    position: relative;
    padding-bottom: 24px;

    &__header {
        &-title {
            font-weight: 600;
            font-size: 0.8rem;
        }
    }

    &__content {
        overflow-y: auto;
        max-height: 470px;
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
</style>
