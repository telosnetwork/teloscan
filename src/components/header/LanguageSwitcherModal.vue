<script>
import messages from 'src/i18n';

export default {
    name: 'LanguageSwitcherModal',
    emits: ['hide'],
    props: {
        show: {
            type: Boolean,
            default: false,
        },
    },
    data: () => ({
        selectedLanguage: null,

        languageOptions: null,
    }),
    created() {
        this.selectedLanguage = {
            code: this.$i18n.locale,
            name: this.$t('locale.current_language_name'),
        };

        // languageOptions: [
        //     { code: 'en-us', name: 'English'},
        //     { code: 'es-es', name: 'Español'},
        //     ...
        // ],
        this.languageOptions = Object.keys(messages).map(key => ({
            code: key,
            name: messages[key].locale.current_language_name,
        }));
    },
    watch: {
        'selectedLanguage.code'(newCode, oldCode) {
            if (newCode !== oldCode) {
                this.changeLanguage();
            }
        },
    },
    methods: {
        changeLanguage() {
            this.$setLocale(this.selectedLanguage.code);
        },
    },
};
</script>

<template>
<q-dialog :model-value="show" @hide="() => $emit('hide')">
    <q-card rounded class="c-language-switcher__card">
        <q-card-section class="q-pa-md">
            <p class="text-h6">
                {{ $t('components.header.select_language') }}
            </p>

            <q-select
                v-model="selectedLanguage"
                :options="languageOptions"
                option-value="code"
                option-label="name"
                color="secondary"
                class="q-mb-lg"
            />

            <q-card-actions align="right">
                <q-btn
                    v-close-popup
                    flat
                    :label="$t('global.cancel')"
                />
            </q-card-actions>
        </q-card-section>
    </q-card>
</q-dialog>
</template>

<style lang="scss">
.c-language-switcher {
    &__card {
        width: 700px;
        max-width: 80vw;
    }
}
</style>
