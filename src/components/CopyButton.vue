<template>
    <div class="c-copy-button">
        <q-icon
            :class="iconClasses"
            :aria-label="hint"
            aria-role="button"
            tabindex="0"
            @keydown.space.enter="handleClick"
            @click="handleClick"
        >
            <q-tooltip>{{ hint }}</q-tooltip>
        </q-icon>
            

    </div>
</template>

<script>
const icons = {
    copy: 'far fa-copy',
    success: 'fas fa-check'
};

export default {
    name: 'CopyButton',
    props: {
        text: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
    },
    data: () => ({
        iconClass: icons.copy,
        hint: ''
    }),
    computed: {
        iconClasses() {
            return `c-copy-button__icon ${this.iconClass} q-pa-sm`;
        },
        defaultHint() {
            return `Copy ${this.description} to clipboard`;
        }
    },
    created() {
        this.hint = this.defaultHint;
    },
    methods: {
        handleClick() {
            navigator.clipboard.writeText(this.text);
            this.iconClass = icons.success;
            this.hint = "Copied";

            setTimeout(() => {
                this.iconClass = icons.copy;
                this.hint = this.defaultHint;
            }, 1500);
        }
    }
}
</script>

<style lang="scss">
.c-copy-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    &__icon {
        cursor: pointer;
    }
}
</style>
