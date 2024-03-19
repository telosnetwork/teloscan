<script setup lang="ts">
import { LatestContainerOptions } from 'src/types';
import { ref, defineProps, computed } from 'vue';
import { useRouter } from 'vue-router';


const router = useRouter();

const props = defineProps<{
  options: LatestContainerOptions
}>();

const selectedOption = ref(Object.keys(props.options)[0]);

const currentView = computed(() => selectedOption.value);

// FIXME: remove this
console.log(currentView);

const selectOption = (option: string) => {
    selectedOption.value = option;
};

const goToPage = (link: string) => {
    router.push({ name: link });
};

</script>

<template>
<q-card class="c-latest-data">
    <!--
    <q-item>
        <q-item-section avatar>
            <q-avatar>
                <img src="https://cdn.quasar.dev/img/avatar2.jpg">
            </q-avatar>
        </q-item-section>

        <q-item-section>
            <q-item-label>Title</q-item-label>
            <q-item-label caption>Subhead</q-item-label>
        </q-item-section>
    </q-item>

    <img src="https://cdn.quasar.dev/img/parallax2.jpg">
    <q-card-section>
        <div class="c-latest-data__header">
            <div class="c-latest-data__header-title">Latest Blocks</div>

            <div class="c-latest-data__header-customize">
                <q-btn
                    color="grey-7"
                    round
                    flat
                    icon="more_vert"
                >
                    <q-menu cover auto-close>
                        <q-list>
                            <q-item clickable>
                                <q-item-section>Latest Blocks</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Latest Transactions</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </div>
        </div>
    </q-card-section>


    color="grey-7"
    icon="border_all"
    icon="dashboard"
    -->

    <q-item class="c-latest-data__header">
        <q-item-section class="c-latest-data__header-title">{{ props.options[selectedOption].title }}</q-item-section>
        <q-item-section avatar class="c-latest-data__header-customize">
            <q-btn
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

    <q-card-section>
        <template v-for="(name, key) in props.options" :key="key">
            <slot v-if="selectedOption === key" :name="key"></slot>
        </template>
    </q-card-section>


    <q-card-actions align="center" class="c-latest-data__footer" @click="goToPage(props.options[selectedOption].link)">
        <span class="c-latest-data__footer-text"> {{  props.options[selectedOption].footer  }} </span>
        <q-icon name="arrow_forward" class="c-latest-data__footer-icon" />
    </q-card-actions>

</q-card>


<!--
<div class="c-latest-data">
    <div class="header">
        <button
            v-for="(name, key) in options"
            :key="key"
            :class="{ active: currentView === key }"
            @click="selectedOption = key.toString()"
        >
            {{ name }}
        </button>
    </div>

    <div class="content">
        <template v-for="(name, key) in options" :key="key">
            <slot v-if="currentView === key" :name="key"></slot>
        </template>
    </div>
</div>
-->
</template>

<style lang="scss">
.c-latest-data {
    border-radius: 12px;

    &__header {
        &-title {
            font-weight: 600;
            font-size: 0.8rem;
        }
    }

    &__menu-opt-check {
        opacity: 0;
        &--active {
            opacity: 1;
        }
    }

    &__footer {
        cursor: pointer;
        display: flex;
        gap: 5px;
        &-text {
            font-size: 0.7rem;
            text-transform: uppercase;
        }
        &:hover {
            color: var(--q-primary);
        }
    }
}


/*
.c-latest-data {
    &__header {
        display: flex;
        justify-content: space-between;
    }
}
*/
/*
.header button {
  margin-right: 10px;
}
.header button.active {
  font-weight: bold;
}
*/
</style>
