<script>
import JsonViewer from 'vue-json-viewer';
import ParameterList from 'components/Transaction/ParameterList';
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

export default {
    name: 'FragmentListElement',
    components: {
        AddressField,
        JsonViewer,
        ParameterList,
    },
    props: {
        fragment: {
            type: Object,
            required: false,
        },
        rawFragment: {
            type: Object,
            required: true,
        },
        transactionFrom: {
            type: String,
            required: false,
        },
    },
    data(){
        return {
            showWei: false,
            address: null,
            expanded: false,
            expanded_parameters: [],
        };
    },
    created(){
        if(!this.fragment) {
            return;
        }
        this.address = (this.fragment.contract) ? this.fragment.contract.address : this.fragment.address;
        if(this.address){
            this.address = (this.address.startsWith('0x')) ? this.address : '0x' + this.address;
        }
        let inputs = this.fragment.eventFragment ? this.fragment.eventFragment.inputs : this.fragment.inputs;
        if(inputs){
            for(let i=0; i < inputs.length;i++){
                this.expanded_parameters.push({});
            }
        }
    },
    methods: {
        toggle(param, index) {
            this.expanded_parameters[param][index] = !this.expanded_parameters[param][index];
        },
        formatWei(number, decimals){
            return formatWei(BigNumber.from(number), decimals);
        },
    },
    computed: {
        depthStyle(){
            if(typeof this.fragment.depth === 'undefined') {
                return;
            }
            return { marginLeft: (this.fragment.depth * 20)  + 'px' };
        },
        inputs(){
            return this.fragment.eventFragment ? this.fragment.eventFragment.inputs : this.fragment.inputs;
        },
        params(){
            let args = [];
            let inputs = this.fragment.eventFragment ? this.fragment.eventFragment.inputs : this.fragment.inputs;
            inputs?.forEach((input, i) => {
                args.push({
                    name: input.name,
                    type: input.type,
                    arrayChildren: (input.arrayChildren !== null) ? input.arrayChildren.type : false,
                    value:  this.fragment.args[i],
                });
            });
            return args;
        },
        fragmentClass(){
            let fragmentClass = 'c-fragment-list-element__head justify-between items-center';
            return (this.isExpandable) ? fragmentClass + ' clickable' : fragmentClass;
        },
        isExpandable(){
            return (
                this.fragment.error ||
                this.fragment.inputs && this.fragment.inputs.length > 0 ||
                this.fragment.value && this.fragment.value !== '0.0' ||
                !this.fragment.name
            );
        },
        arrowIcon() {
            if(!this.isExpandable) {
                return '';
            }
            return this.expanded ? 'arrow_drop_down' : 'arrow_right';
        },
    },
};
</script>

<template>
<div v-if="fragment" class="c-fragment-list-element" :style="depthStyle"  >
    <div :class="fragmentClass" @click="expanded = !expanded">
        <span class="row text-left">
            <div>
                <q-icon
                    v-if="isExpandable"
                    :name="arrowIcon"
                    size="sm"
                />
            </div>
            <div>
                <strong v-if="fragment?.name">
                    <span v-if="fragment.name.length > 190">{{ fragment.name.substring(0, 190) }}...</span>
                    <span v-else>{{ fragment.name }}</span>
                </strong>
                <strong v-else>
                    {{ $t('components.transaction.unknown') }} ({{ fragment.function_signature }})
                </strong>
            </div>
            <q-icon
                v-if="fragment.error"
                name="warning"
                color="negative"
                class="q-ml-xs"
            />
        </span>
        <small>
            <AddressField
                v-if="address"
                :address="address"
                :truncate="15"
                class="word-break"
                :name="fragment.contract?.name"
                :highlight="transactionFrom && fragment.contract?.address === transactionFrom"
                :copy="true"
            />
        </small>
    </div>
    <div v-if="expanded" class="q-pl-md q-pr-md">
        <div v-if="fragment.error" class="negative q-pa-md flex align-center q-mb-sm rounded-borders">
            <q-icon
                name="warning"
                color="negative"
                class="q-mr-xs"
                size="1.4em"
            />
            <span class="text-negative">{{ fragment.error }}</span>
        </div>
        <div v-if="fragment?.name" :key="fragment.name">
            <ParameterList :params="params" :trxFrom="transactionFrom" :contract="fragment.contract" />
            <div v-if="fragment.value && fragment.value !== 0">
                <div v-if="fragment.isTransferETH" >
                    <div class="fit row justify-start items-start content-start">
                        <div class="col-4">
                            <q-icon class="list-arrow" name="arrow_right"/>
                            <span>{{ $t('pages.from').toLowerCase() }}</span>
                        </div>
                        <div class="col-8">
                            <AddressField
                                :address="fragment.from"
                                :truncate="0"
                                :copy="true"
                                :highlight="
                                    transactionFrom
                                        && fragment.from.toLowerCase() === transactionFrom.toLowerCase()
                                "
                                class="word-break"
                            />
                        </div>
                    </div>
                    <div class="fit row justify-start items-start content-start">
                        <div class="col-4">
                            <q-icon class="list-arrow" name="arrow_right"/>
                            <span>{{ $t('pages.to').toLowerCase() }}</span>
                        </div>
                        <div class="col-8">
                            <AddressField
                                :address="fragment.to"
                                :truncate="0"
                                :copy="true"
                                :highlight="
                                    transactionFrom
                                        && fragment.to.toLowerCase() === transactionFrom.toLowerCase()
                                "
                                class="word-break"
                            />
                        </div>
                    </div>
                </div>
                <div class="fit row justify-start items-start content-start">
                    <div class="col-4">
                        <q-icon class="list-arrow" name="arrow_right"/>
                        <span>{{ $t('components.transaction.value_uint256').toLowerCase() }}</span>
                    </div>
                    <div class="col-8">
                        {{ fragment.value }} TLOS
                    </div>
                </div>
            </div>
        </div>
        <JsonViewer
            v-else
            :value="rawFragment"
            theme="custom-theme"
            class="q-mb-md"
        />
    </div>
</div>
</template>

<style lang="scss" scoped>
body.body--dark .c-fragment-list-element  .negative {
    background: $negative;
    span, .q-icon {
        color: white !important;
    }
}
.c-fragment-list-element {
    margin-bottom: 24px;

    &__head {
        background: rgba(0, 0, 0, 0.1);
        padding: 10px 20px;
        user-select: none;
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        word-break: break-word;
        border-radius: 5px;
        transition: 300ms background-color ease;

        @at-root .body--dark & {
            background: rgba(0, 0, 0, 0.25);
        }
        .row {
            flex-flow: nowrap;
            max-width: 70%;
        }
        .q-icon {
            margin-top: -3px;
        }
    }
    pre {
        font-family: inherit;
        font-size: inherit;
        margin: auto;
    }

    &__fragment {
        white-space: pre;
    }
    .negative {
        border: 1px solid;
    }
}
.jv-container .jv-code {
    padding: 10px 10px 10px 10px;
}
@media only screen and (max-width: 480px){
    .c-fragment-list-element {
        &__head {
            display: block;
            text-align: center;
            padding: 15px;
            .c-address-field {
                border-top: 1px solid rgba(255, 255, 255, 0.3);
                padding-top: 10px;
                width: 100%;
                display: flex;
                margin-top: 15px;
            }
            .q-icon {
                margin-left: -7px;
                font-size: 20px;
            }
            .row {
                flex-flow: nowrap;
                max-width: 100%;
            }
        }
    }
}
@media only screen and (max-width: 400px){
    .c-fragment-list-element {
        &__head {
            font-size: 0.9em;
        }
    }
}
</style>
