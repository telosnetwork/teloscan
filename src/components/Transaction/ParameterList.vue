<script>
import AddressField from 'components/AddressField';
export default {
    name: 'ParameterList',
    components: {
        AddressField,
    },
    methods: {
        toggle(param, value) {
            this.expanded[param][value] = !this.expanded[param][value];
        },
    },
    data(){
        let expanded = [];
        for(let i = 0; i < this.params.length;i++){
            expanded.push({ 'expanded' : false });
        }
        return {
            expanded: expanded,
        };
    },
    props: {
        params: {
            type: Array,
            required: true,
        },
        trxFrom: {
            type: String,
            required: false,
        },
        contract: {
            type: Object,
            required: true,
        },
    },
};
</script>

<template>
<div v-for="(param, pIndex) in params" :key="pIndex" class="fit row wrap justify-start items-start content-start">
    <div class="col-4">
        <q-icon class="list-arrow" name="arrow_right"/>
        <span v-if="param.name">{{ param.name }} ({{ param.type }}) :</span>
        <span v-else>{{ param.type }} :</span>
    </div>
    <div
        v-if="param.arrayChildren || param.type === 'tuple'"
        class="col-8 word-break"
        v-on:click.stop="param.value.length > 1 && toggle(pIndex, 'expanded')"
    >
        <div v-if="param.value.length > 0">
            <div>[</div>
            <div
                v-for="(value, index) in param.value"
                :key="`key-${index}`"
                :class="(expanded[pIndex]['expanded'] || param.value.length === 1) ? 'q-pl-md' : 'q-pl-md hidden'"
            >
                <div v-if="param.arrayChildren === 'tuple'" :class="index !== param.value.length - 1 ? 'q-mb-md' : ''">
                    <div v-if="value.length > 0">
                        <div>[</div>
                        <div v-for="(tuple, i) in value" :key="`tuple-${i}`" class="q-pl-md">
                            {{ tuple }}
                        </div>
                        <div>]</div>
                    </div>
                    <div v-else>[]</div>
                    <br v-if="index !== param.value.length - 1">
                </div>
                <div v-else-if="param.arrayChildren === 'address'">
                    <AddressField
                        :highlight="trxFrom === value.toLowerCase()"
                        :address="value"
                        copy
                        :name="value.toLowerCase() === contract.address && contract.name ?  contract.name : null"
                    />
                </div>
                <div v-else-if="param.arrayChildren === 'uint128' || param.arrayChildren === 'uint256'">
                    {{ value }},
                </div>
                <div
                    v-else-if="typeof value === 'object'"
                    v-on:click.stop="value.length > 1 && toggle(pIndex, index) ||
                        value.length === 1 && toggle(pIndex, 'expanded')
                    "
                >
                    <div>[</div>
                    <div
                        v-for="(value2, index2) in value"
                        :key="`index2-${index2}`"
                        :class="(expanded[pIndex][index] || value.length === 1) ? 'q-pl-md' : 'q-pl-md hidden'"
                    >
                        <div v-if="typeof value2 === 'object'">
                            <div>[</div>
                            <div
                                v-for="(value3, index3) in value2"
                                :key="`index3-${index3}`"
                                class="q-pl-sm"
                            >
                                {{ value3 }},
                            </div>
                            <div>]</div>
                        </div>
                        <div v-else>{{ value2 }},</div>
                    </div>
                    <div v-if="!expanded[pIndex][index] && value.length > 1" class="q-px-sm ellipsis-label q-mb-xs">
                        ...
                    </div>
                    <div>]</div>
                </div>
                <div v-else>{{ value }},</div>
            </div>
            <div v-if="!expanded[pIndex]['expanded'] && param.value.length > 1" class="q-px-sm ellipsis-label q-mb-xs">
                ...
            </div>
            <div>]</div>
        </div>
        <div v-else>[]</div>
    </div>
    <div v-else-if="param.type === 'address'" class="col-8 word-break">
        <AddressField
            :highlight="trxFrom === param.value.toLowerCase()"
            :address="param.value"
            copy
            :name="param.value.toLowerCase() === contract.address && contract.name ?  contract.name : null"
        />
    </div>
    <div v-else class="col-8 word-break">{{ param.value }}</div>
</div>
</template>


<style lang="sass" scoped>
@media only screen and (max-width: 550px)
    .col-4, .col-8
        width: 100%
    .col-8
        padding-left: 14px
</style>
