<script>

export default {
    name: 'ConfirmationDialog',
    components: {},
    props: {
        flag: {
            type: Boolean,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            showDialog: false,
            icon: 'warning',
            color: 'text-negative',
            dialogMessage: '',
        };
    },
    async created() {
        // initialization of the translated texts
        this.dialogMessage = this.$t('components.verify_prompt');
    },
    watch: {
        flag(val){
            this.showDialog = val;
        },
        status(val){
            if (val) {
                this.icon = 'verified';
                this.color = 'text-positive';
                this.dialogMessage = this.$t('pages.view_source_prompt');
            } else {
                this.icon = 'warning';
                this.color = 'text-negative';
                this.dialogMessage = this.$t('components.verify_prompt');
            }
        },
        showDialog(val){
            if (!val) {
                this.$emit('dialog', val);
            }
        },
    },
    methods: {
        navigate(){
            window.open('https://sourcify.dev', '_blank');
        },
    },
};
</script>

<template>
<q-dialog v-model="showDialog">
    <q-card>
        <q-card-section class="rows items-center">
            <q-icon
                :name="icon"
                :class="color"
                size="1.25rem"
                text-color="white"
            />
            <span class="q-ml-sm c-verification-dialog__text">{{ dialogMessage }}</span>
        </q-card-section>
        <q-card-actions align="right">
            <q-btn
                v-close-popup
                flat
                :label="$t('global.dismiss')"
            />
            <q-btn
                v-if="!status"
                v-close-popup
                flat
                :label="$t('pages.verify_contract')"
                @click="navigate"
            />
        </q-card-actions>
    </q-card>
</q-dialog>
</template>

<style lang="scss">
.c-verification-dialog {
    &__text {
        color: black;

        @at-root .body--dark & {
            color: white;
        }
    }
}
</style>
