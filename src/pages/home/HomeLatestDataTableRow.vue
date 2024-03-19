<script setup lang="ts">
defineProps<{
    loading: boolean;
}>();
</script>

<template>
<tr
    :class="{
        'c-latest-data-row': true,
        'c-latest-data-row--loading': loading
    }"
>
    <td class="c-latest-data-row__td">
        <q-skeleton v-if="loading" type="rect" size="48px" />
        <div v-else class="c-latest-data-row__icon-container">

            <slot name="icon">
            </slot>
        </div>
    </td>

    <td class="c-latest-data-row__td">
        <template v-if="loading">
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </template>
        <slot v-else name="column-one">
        </slot>
    </td>

    <td class="c-latest-data-row__td">
        <template v-if="loading">
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </template>
        <slot v-else name="column-two">
        </slot>
    </td>

    <td class="c-latest-data-row__td">
        <template v-if="loading">
            <q-skeleton type="rect" height="22px" class="q-mb-xs" />
            <q-skeleton type="rect" height="22px" />
        </template>
        <slot v-else name="column-three">
        </slot>
    </td>
</tr>

</template>

<style lang="scss">
.c-latest-data-row {
    $this: &;

    border-bottom: 1px solid var(--border-color);

    &--loading {
        #{$this}__td {
            &:first-of-type {
                height: 48px;
                width: 48px;
            }
        }
    }

    &__td {
        padding: 12px 8px;
    }

    &__icon-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 48px;
        width: 48px;
        background-color: $grey-3;
        border-radius: 12px;

        body.body--dark & {
            background-color: $grey-9;
        }
    }
}
</style>
