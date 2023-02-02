<script>
import { directive as clickaway } from 'vue3-click-away';

export default {
    name: 'HeaderSearch',
    directives: {
        clickaway,
    },
    emits: ['hidden-mobile'],
    data() {
        return {
            inputHiddenMobile: true,
            searchTerm: null,
            searchHintIndex: 0,
            TIME_DELAY: 6000,
        };
    },
    watch: {
        inputHiddenMobile(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.$emit('hidden-mobile', newValue);
            }
        },
    },
    methods: {
        async iconClicked() {
            this.inputHiddenMobile = false;

            await this.$nextTick();
            this.$refs.input.focus();
        },
        async search() {
            if (!this.searchTerm) {
                return;
            }

            this.searchTerm = this.searchTerm.trim().replace(/\s/, '');
            if (this.searchTerm.startsWith('0x')) {
                if (this.searchTerm.length === 42) {
                    this.$router.push(`/address/${this.searchTerm}`);
                    return;
                } else {
                    this.$router.push(`/tx/${this.searchTerm}`);
                    return;
                }
            } else if (this.searchTerm.match(/(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/)) {
                try {
                    const account = await this.$evm.telos.getEthAccountByTelosAccount(this.searchTerm);
                    this.$router.push(`/address/${account.address}`);
                    return;
                } catch (e) {
                    // in case this was a block that looked like an account name let's try it as a block
                    if (this.searchTerm && !isNaN(this.searchTerm)) {
                        this.$router.push(`/block/${this.searchTerm}`);
                        return;
                    }

                    this.$q.notify({
                        position: 'top',
                        message: this.$('components.header.address_not_found', { account: this.searchTerm }),
                        timeout: this.TIME_DELAY,
                    });
                    return;
                }
            } else if (!isNaN(this.searchTerm)) {
                this.$router.push(`/block/${this.searchTerm}`);
                return;
            }

            this.$q.notify({
                position: 'top',
                message: this.$('components.header.search_failed'),
                timeout: this.TIME_DELAY,
            });
        },
    },
};
</script>

<template>
<div v-clickaway="() => inputHiddenMobile = true" class="c-search">
    <q-icon
        v-show="$q.screen.lt.lg && inputHiddenMobile"
        name="search"
        size="24px"
        class="cursor-pointer"
        tabindex="0"
        role="switch"
        :aria-checked="!inputHiddenMobile"
        aria-label="reveal search input"
        @keydown.enter="iconClicked"
        @click="iconClicked"
    />
    <q-input
        v-show="!$q.screen.lt.lg || !inputHiddenMobile"
        ref="input"
        v-model="searchTerm"
        class="c-search__input"
        dense
        :standout="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
        :bg-color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
        color="black"
        hide-bottom-space
        :placeholder="$t('components.header.search_placeholder')"
        @keydown.enter="search"
    >
        <template v-slot:append>
            <q-icon
                v-if="!searchTerm"
                name="search"
                size="24px"
                @click="() => $refs.input.focus()"
            />
            <q-icon
                v-else
                name="clear"
                size="24px"
                @click="searchTerm = null"
            />
        </template>
    </q-input>
</div>
</template>

<style lang="scss">
.c-search {
    --color: #{$dark};

    @media screen and (min-width: $breakpoint-lg-min) {
        width: 500px;
    }

    @at-root .body--dark & {
        --color: white;
    }

    // quasar overrides
    .q-field--standout,
    .q-field--standout.q-field--highlighted {
        .q-field__native,
        .q-field__append {
            color: var(--color);
        }
    }
}
</style>
