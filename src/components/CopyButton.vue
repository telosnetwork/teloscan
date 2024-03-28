<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t: $t } = useI18n();

const props = defineProps({
    text: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    accompanyingText: {
        type: String,
        default: '',
    },
});

const icons = {
    copy: 'far fa-copy',
    success: 'fas fa-check',
};

const iconClass = ref(icons.copy);
const hint = ref('');

const defaultHint = computed(() => $t('components.copy_to_clipboard', { text: props.description }));

const containerClasses = computed(() => {
    const extraClass = props.accompanyingText ? 'c-copy-button--block' : '';
    return `c-copy-button ${extraClass}`;
});

const iconClasses = computed(() => iconClass.value);

onMounted(() => {
    hint.value = defaultHint.value;
});

const handleClick = () => {
    copyToClipboard(props.text).then(() => {
        iconClass.value = icons.success;
        hint.value = $t('components.copied');
        setTimeout(() => {
            iconClass.value = icons.copy;
            hint.value = defaultHint.value;
        }, 1500);
    }).catch((err) => {
        console.error(`Failed to copy to clipboard: ${err}`);
        $q.notify({
            type: 'negative',
            message: $t('components.copy_to_clipboard_failed'),
        });
    });
};
</script>

<template>
<div
    :class="containerClasses"
    :aria-label="hint"
    role="button"
    tabindex="0"
    @click.stop="handleClick"
    @keydown.space.enter="handleClick"
>
    <q-tooltip :offset="[0, 0]" anchor="center end" self="center left">
        {{ hint }}
    </q-tooltip>

    {{ accompanyingText }}

    <q-icon :class="iconClasses" />
</div>
</template>

<style lang="scss">
.c-copy-button {
    display: inline-flex;
    justify-content: center;
    margin-top: -2px;
    align-items: center;
    cursor: pointer;

    &--block {
        display: flex;
        width: max-content;
    }
}
</style>
