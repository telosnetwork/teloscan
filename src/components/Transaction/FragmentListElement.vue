<script>
import JsonViewer from 'vue-json-viewer';
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

export default {
    name: 'FragmentListElement',
    components: {
        AddressField,
        JsonViewer,
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
    },
    data(){
        return {
            showWei: false,
            expanded: false,
            expanded_parameters: [],
        };
    },
    created(){
        if(!this.fragment) {
            return;
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
            return { marginLeft: ((this.fragment.depth * 20)  + 20) + 'px' };
        },
        inputs(){
            return this.fragment.eventFragment ? this.fragment.eventFragment.inputs : this.fragment.inputs;
        },
        fragmentClass(){
            let fragmentClass = 'c-fragment-list-element__head justify-between items-center';
            return (this.isExpandable) ? fragmentClass + ' clickable' : fragmentClass;
        },
        isExpandable(){
            return (
                this.fragment.inputs && this.fragment.inputs.length > 0 ||
                this.fragment.value ||
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
        <span class="row items-center">
            <q-icon :name="arrowIcon" size="sm" />
            <strong v-if="fragment?.name">
                {{ fragment.name }}
            </strong>
            <strong v-else>
                {{ $t('components.transaction.unknown') }} ({{ fragment.function_signature }})
            </strong>
        </span>
        <small v-if="fragment.contract">
            <AddressField
                :address="
                    (fragment.contract.address[0] === '0' && fragment.contract.address[1] === 'x') ?
                        fragment.contract.address :
                        '0x' + fragment.contract.address
                "
                :truncate="15"
                class="word-break"
                :name="fragment.contract.name"
                :copy="true"
            />
        </small>
    </div>
    <div v-if="expanded" class="q-pl-md">
        <div v-if="fragment?.name" :key="fragment.name">
            <div
                v-for="(param, index) in inputs"
                :key="`fragment-${index}`"
                class="fit row justify-start items-start content-start"
            >
                <div class="col-4">
                    <template v-if="param.name">
                        {{ param.name }} ({{ param.type }}):
                    </template>

                    <template v-else>
                        {{ param.type }}:
                    </template>
                </div>

                <div class="col-8">
                    <AddressField
                        v-if="param.type === 'address'"
                        :address="fragment.args[index]"
                        :truncate="0"
                        class="word-break"
                        :copy="true"
                    />
                    <div v-else-if="param.type === 'uint256' || param.type === 'uint128'"  class="word-break">
                        <div v-if="fragment.isTransfer && fragment.contract && fragment.contract.isToken()">
                            <div
                                v-if="fragment.contract.supportedInterfaces.includes('erc20')"
                                class="clickable"
                                @click="showWei = !showWei"
                            >
                                <span v-if="!showWei">
                                    <span> {{
                                        formatWei(fragment.args[index],
                                                  fragment.contract.properties.decimals)
                                    }}</span>
                                    <q-tooltip>Show wei</q-tooltip>
                                    <AddressField
                                        :address="fragment.contract.address"
                                        :truncate="0"
                                        :name="fragment.contract.properties.symbol"
                                        class="word-break q-ml-xs"
                                    />
                                </span>
                                <span v-else>
                                    {{ fragment.args[index] }}
                                </span>
                            </div>
                            <div v-else>
                                <AddressField
                                    v-if="fragment.contract.properties.symbol"
                                    :address="fragment.contract.address"
                                    :truncate="0"
                                    :name="fragment.contract.properties.symbol"
                                    class="word-break"
                                />
                                <span v-if="fragment.contract.properties.symbol"> #</span>
                                <span> {{ fragment.args[index] }}</span>
                            </div>
                        </div>
                        <div v-else class="word-break">
                            {{ fragment.args[index] }}
                        </div>
                    </div>
                    <div v-else-if="param.type === 'tuple'" v-on:click.stop="toggle(index, 'expanded')">
                        <div>[ </div>
                        <div
                            v-for="(i) in fragment.args[index].length - 1"
                            :key="param.type + i"
                            :class="
                                (expanded_parameters[index]['expanded']) ?
                                    'q-pl-xl word-break' :
                                    'q-pl-xl word-break hidden'
                            "
                        >
                            {{ i }},
                        </div>
                        <div
                            v-if="!expanded_parameters[index]['expanded']"
                            class="q-px-sm ellipsis-label q-mb-xs"
                        >...</div>
                        <div>]</div>
                    </div>
                    <div
                        v-else-if="param.arrayChildren && fragment.args[index]"
                        v-on:click.stop="toggle(index, 'expanded')"
                    >
                        <div>[ </div>
                        <div
                            v-for="i in fragment.args[index].length - 1"
                            :key="param.type + i"
                            :class="
                                (expanded_parameters[index]['expanded']) ?
                                    'q-pl-xl word-break' :
                                    'q-pl-xl word-break hidden'
                            "
                        >
                            <div v-if="param.arrayChildren.type === 'address'">
                                <AddressField
                                    :address="fragment.args[index][i]"
                                    :truncate="0"
                                    class="word-break"
                                    :copy="true"
                                />
                            </div>
                            <span v-else class="word-break">{{ fragment.args[index][i] }},</span>
                        </div>
                        <div
                            v-if="!expanded_parameters[index]['expanded']"
                            class="q-px-sm ellipsis-label q-mb-xs"
                        >...</div>
                        <div>]</div>
                    </div>
                    <div v-else class="word-break">
                        {{ fragment.args[index] }}
                    </div>
                </div>
            </div>
            <div v-if="fragment.value">
                <div class="fit row justify-start items-start content-start">
                    <div class="col-4">
                        {{ $t('components.transaction.value_uint256') }}
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
    }

    &__fragment {
        white-space: pre;
    }
}
.jv-container .jv-code {
    padding: 10px 10px 10px 10px;
}
@media only screen and (max-width: 400px){
    .c-fragment-list-element {
        &__head {
            font-size: 0.9em;
        }
    }
}
</style>
