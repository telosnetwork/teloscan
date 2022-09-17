<template>
<div class="c-log-table-row"  >
    <div class="c-log-table-row__head" @click="expanded = !expanded">
        <q-icon :name="arrowIcon" size="sm" class="q-mb-xs" />
        <strong v-if="log.name">
            {{ log.name }}
        </strong>
        <strong v-else>
            Unknown ({{ log.topics[0].substr(0, 10) }})
        </strong>
    </div>
    <div class="q-pl-md" v-if="expanded">
        <div v-if="log.name" :key="log.name">
            <div
                v-for="(param, index) in log.eventFragment.inputs"
                :key="`log-${index}`"
                class="fit row justify-start items-start content-start"
            >
                <div class="col-4">
                    <template v-if="param.name">
                        {{ param.name }} ({{ param.type }}) :
                    </template>

                    <template v-else>
                        {{ param.type }}:
                    </template>
                </div>

                <div class="col-8">
                    <address-field
                        v-if="param.type === 'address'"
                        :address="log.args[index]"
                        :truncate="0"
                        :copy="true"
                    />
                    <div v-else-if="param.type === 'uint256' || param.type === 'uint128'"  class="word-break">
                        <div v-if="log.isTransfer && log.token  ">
                            <div v-if="!log.token.type || log.token.type === 'erc20'">
                                {{ log.args[index] / (10 ** log.token.decimals) }}
                                <router-link :to="`/address/${log.address}`">
                                    {{ log.token.symbol }}
                                </router-link>
                            </div>
                            <div v-else>
                                <router-link :to="`/address/${log.address}`">
                                    {{ log.token.symbol }}
                                </router-link>
                                #{{ log.args[index] }}
                            </div>
                        </div>
                        <div v-else class="word-break">
                            {{ log.args[index] }}
                        </div>
                    </div>
                    <div v-else-if="param.arrayChildren && log.args[index]">
                        <div>[ </div>
                        <div v-for="i in log.args[index].length - 1" class="q-pl-xl word-break" :key="param.type + i">
                            <div v-if="param.arrayChildren.type === 'address'">
                                <address-field
                                    :address="log.args[index][i]"
                                    :truncate="0"
                                    :copy="true"
                                />
                            </div>
                            <span v-else>{{ log.args[index][i] }},</span>
                        </div>
                        <div>]</div>
                    </div>
                    <div v-else class="word-break">
                        {{ log.args[index] }}
                    </div>
                </div>
            </div>
        </div>

        <json-viewer
            v-else
            :value="rawLog"
            theme="custom-theme"
            class="q-mb-md"
        />
    </div>
</div>
</template>

<script>
import JsonViewer from 'vue-json-viewer'
import AddressField from 'components/AddressField';

export default {
    name: 'LogsTableRow',
    components: {
        AddressField,
        JsonViewer,
    },
    props: {
        log: {
            type: Object,
            required: true,
        },
        rawLog: {
            type: Object,
            required: true,
        },
    },
    data: () => ({
        expanded: false,
    }),
    computed: {
        arrowIcon() {
            return this.expanded ? 'arrow_drop_down' : 'arrow_right';
        },
    },
}
</script>

<style lang="scss">
.c-log-table-row {
    margin-bottom: 24px;

    &__head {
        background: rgba(0, 0, 0, 0.1);
        padding: 10px 20px;
        margin-bottom: 12px;
        cursor: pointer;
        border-radius: 5px;
        transition: 300ms background-color ease;

        @at-root .body--dark & {
            background: rgba(0, 0, 0, 0.25);
        }
    }

    &__log {
        white-space: pre;
    }
}
</style>
