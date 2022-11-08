<template>
<div class="c-fragment-table-row" :style="style" v-if="fragment"  >
    <div class="c-fragment-table-row__head justify-between items-center" @click="expanded = !expanded">
        <span class="row items-center">
            <q-icon :name="arrowIcon" size="sm" />
            <strong v-if="fragment?.name">
                {{ fragment.name }}
            </strong>
            <strong v-else>
                Unknown ({{ rawFragment.topics[0].substr(0, 10) }})
            </strong>
        </span>
        <small v-if="fragment.contract">
            <address-field
                :address="fragment.contract.address"
                :truncate="15"
                class="word-break"
                :name="fragment.contract.name"
                :copy="true"
            />
        </small>
    </div>
    <div class="q-pl-md" v-if="expanded">
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
                    <address-field
                        v-if="param.type === 'address'"
                        :address="fragment.args[index]"
                        :truncate="0"
                        class="word-break"
                        :copy="true"
                    />
                    <div v-else-if="param.type === 'uint256' || param.type === 'uint128'"  class="word-break">
                        <div v-if="fragment.isTransfer && fragment.token">
                            <div @click="showWei = !showWei" class="clickable" v-if="!fragment.token.type || fragment.token.type === 'erc20'">
                                <span v-if="!showWei">
                                    <span> {{ formatWei(fragment.args[index], fragment.token.decimals) }}</span>
                                    <q-tooltip>Show wei</q-tooltip>
                                    <address-field
                                        :address="fragment.token.address"
                                        :truncate="0"
                                        :name="fragment.token.symbol"
                                        class="word-break q-ml-xs"
                                    />
                                </span>
                                <span v-else>
                                    {{ fragment.args[index] }}
                                </span>
                            </div>
                            <div v-else>
                                <address-field
                                    :address="fragment.token.address"
                                    :truncate="0"
                                    :name="fragment.token.symbol"
                                    class="word-break"
                                />
                                #{{ fragment.args[index] }}
                            </div>
                        </div>
                        <div v-else class="word-break">
                            {{ fragment.args[index] }}
                        </div>
                    </div>
                    <div v-else-if="param.type === 'tuple'" v-on:click.stop="toggle(index, 'expanded')">
                        <div>[ </div>
                        <div v-for="(i) in fragment.args[index].length - 1" :class="(expanded_parameters[index]['expanded']) ? 'q-pl-xl word-break' : 'q-pl-xl word-break hidden'" :key="param.type + i">
                            {{ i }},
                        </div>
                        <div v-if="!expanded_parameters[index]['expanded']" class="q-px-sm ellipsis-label q-mb-xs">...</div>
                        <div>]</div>
                    </div>
                    <div v-else-if="param.arrayChildren && fragment.args[index]" v-on:click.stop="toggle(index, 'expanded')">
                        <div>[ </div>
                        <div v-for="i in fragment.args[index].length - 1" :class="(expanded_parameters[index]['expanded']) ? 'q-pl-xl word-break' : 'q-pl-xl word-break hidden'" :key="param.type + i">
                            <div v-if="param.arrayChildren.type === 'address'">
                                <address-field
                                    :address="fragment.args[index][i]"
                                    :truncate="0"
                                    class="word-break"
                                    :copy="true"
                                />
                            </div>
                            <span v-else class="word-break">{{ fragment.args[index][i] }},</span>
                        </div>
                        <div v-if="!expanded_parameters[index]['expanded']" class="q-px-sm ellipsis-label q-mb-xs">...</div>
                        <div>]</div>
                    </div>
                    <div v-else class="word-break">
                        {{ fragment.args[index] }}
                    </div>
                </div>
            </div>
            <div class="fit row justify-start items-start content-start" v-if="fragment.value">
                <div class="col-4">
                    value
                </div>
                <div class="col-8">
                    {{ fragment.value }} TLOS
                </div>
            </div>
        </div>
        <json-viewer
            v-else
            :value="rawFragment"
            theme="custom-theme"
            class="q-mb-md"
        />
    </div>
</div>
</template>

<script>
import JsonViewer from 'vue-json-viewer'
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
        }
    },
    created(){
        if(!this.fragment) return;
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
        style(){
            if(typeof this.fragment.depth === 'undefined') return;
            return {marginLeft: ((this.fragment.depth * 20)  + 20) + 'px'};
        },
        inputs(){
            return this.fragment.eventFragment ? this.fragment.eventFragment.inputs : this.fragment.inputs;
        },
        arrowIcon() {
            return this.expanded ? 'arrow_drop_down' : 'arrow_right';
        },
    },
}
</script>

<style lang="scss">
.c-fragment-table-row {
    margin-bottom: 24px;

    &__head {
        background: rgba(0, 0, 0, 0.1);
        padding: 10px 20px;
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        word-break: break-word;
        cursor: pointer;
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
@media only screen and (max-width: 400px){
    .c-fragment-table-row {
        &__head {
            font-size: 0.9em;
        }
    }
}
</style>
