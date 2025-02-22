<script>
import axios from 'axios';
import { useChainStore } from 'src/core';

// TODO: remove this
const API_URL = useChainStore().currentChain.settings.getMonitorUrl();
const API_ENDPOINT_TASKS = API_URL + '/tasks';
const API_ENDPOINT_STATUSES = API_URL + '/task_status';
const API_ENDPOINT_CATEGORIES = API_URL + '/task_categories';

export default {
    name: 'MonitorComponent',
    async mounted() {
        await this.getTasks();
        await this.getCategories();
        await this.onRequest({
            pagination: this.pagination,
        });
    },
    data() {
        const columns = [
            {
                name: 'status',
                label: '',
                align: 'left',
            },
            {
                name: 'checked_at',
                label: '',
                align: 'left',
            },
            {
                name: 'category',
                label: '',
                align: 'left',
            },
            {
                name: 'task',
                label: '',
                align: 'left',
            },
            {
                name: 'message',
                label: '',
                align: 'left',
            },
        ];

        return {
            rows: [],
            loadingRows: [],
            tasks: [],
            categories: [],
            columns,
            pagination: {
                sortBy: 'checked_at',
                descending: true,
                page: 1,
                rowsPerPage: 20,
                rowsNumber: 10000,
            },
            loading: true,
        };
    },
    async created() {
        // initialization of the translated texts
        this.columns[0].label = this.$t('components.health.status');
        this.columns[1].label = this.$t('components.health.checked_at');
        this.columns[2].label = this.$t('components.health.category');
        this.columns[3].label = this.$t('components.health.task');
        this.columns[4].label = this.$t('components.health.message');
        for (var i = 1; i <= this.pagination.rowsPerPage; i++) {
            this.loadingRows.push(i);
        }
    },
    methods: {
        async getCategories(){
            try {
                const results = await axios.get(API_ENDPOINT_CATEGORIES);
                this.categories = results.data;
            } catch (e) {
                console.error(`Could not retrieve task categories: ${e}`);
            }
        },
        async getTasks(){
            try {
                const results = await axios.get(API_ENDPOINT_TASKS);
                this.tasks = results.data;
            } catch (e) {
                console.error(`Could not retrieve tasks: ${e}`);
            }
        },
        async onRequest(props) {
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            this.loading = true;
            try {
                let url = API_ENDPOINT_STATUSES;
                url += '?order=id.desc&select=task(name,category),message,checked_at,type,id&limit=';
                url += rowsPerPage + '&offset=' + rowsPerPage * (page - 1);
                const results = await axios.get(url);

                this.rows = results.data;

                this.pagination.page = page;
                this.pagination.rowsPerPage = rowsPerPage;
                this.pagination.sortBy = sortBy;
                this.pagination.descending = descending;

                this.rows.splice(
                    0,
                    this.rows.length,
                    ...results.data,
                );
                this.loading = false;
            } catch (e) {
                console.error(e);
            }
        },
        getType(id){
            let type = '';
            switch (id) {
            case(1):
                type = this.$t('components.health.success');
                break;
            case(2):
                type = this.$t('components.health.info');
                break;
            case(3):
                type = this.$t('components.health.alert');
                break;
            case(4):
                type = this.$t('components.health.error');
                break;
            }
            return type;
        },
        getCategory(id){
            for(let i in this.categories){
                if(this.categories[i].id === id){
                    return this.categories[i].name;
                }
            }
        },
    },
};
</script>

<template>
<div class="q-mb-md tableWrapper">
    <q-table
        v-if="!loading"
        v-model:pagination="pagination"
        :rows="rows"
        :row-key="row => row.id"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
    >
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @click="col.name==='checked_at' ? showAge =! showAge : null"
            />
            <q-tooltip
                v-if="col.name === 'checked_at'"
                anchor="bottom middle"
                self="bottom middle"
                :offset="[0, 36]"
            >
                {{ $t('components.health.click_to_change_format') }}
            </q-tooltip>
            {{ col.label }}
        </q-tr>

        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td key="status" :props="props">
                    <q-icon
                        v-if="props.row.type === 4"
                        name="warning"
                        color="negative"
                        size="1.15em"
                    />
                    <q-icon
                        v-else-if="props.row.type === 3"
                        name="warning"
                        color="orange"
                        size="1.15em"
                    />
                    <q-icon
                        v-else-if="props.row.type === 2"
                        name="info"
                        color="primary"
                        size="1.15em"
                    />
                    <q-icon
                        v-else
                        name="task_alt"
                        color="positive"
                        size="1.15em"
                    />
                    <q-tooltip>{{ getType(props.row.type) }} </q-tooltip>
                </q-td>
                <q-td key="checked_at" :props="props">{{ props.row.checked_at }}</q-td>
                <q-td key="category" :props="props" class="text-capitalize">
                    {{ getCategory(props.row.task.category) }}
                </q-td>
                <q-td key="task" :props="props">{{ props.row.task.name }}</q-td>
                <q-td key="message" :props="props" :class="(props.row.type === 4) ? 'text-negative' : ''">
                    {{ props.row.message }}
                </q-td>
            </q-tr>
        </template>
    </q-table>
    <q-table
        v-else
        v-model:pagination="pagination"
        :rows="loadingRows"
        :row-key="row => row.id"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
    >
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @click="col.name==='checked_at' ? showAge =! showAge : null"
            />
            <q-tooltip
                v-if="col.name === 'checked_at'"
                anchor="bottom middle"
                self="bottom middle"
                :offset="[0, 36]"
            >
                {{ $t('components.health.click_to_change_format') }}
            </q-tooltip>
            {{ col.label }}
        </q-tr>
        <template v-slot:body="">
            <q-tr>
                <q-td key="status">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="checked_at">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="category">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="task">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
                <q-td key="message">
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
    </q-table>
</div>
</template>

<style scoped lang='scss'>
.tableWrapper{
    width: 100%;
    margin: auto;
}
</style>
