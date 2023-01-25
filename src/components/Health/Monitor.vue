<script>
import axios from 'axios';
const API_URL = (process.env.NETWORK_EVM_CHAIN_ID === 40) ?
    'https://api.monitor.telos.net' :
    'https://api.monitor-test.telos.net';
const API_ENDPOINT_TASKS = API_URL + '/tasks';
const API_ENDPOINT_STATUSES = API_URL + '/task_status';

export default {
    name: 'MonitorComponent',
    async mounted() {
        await this.getTasks();
        this.onRequest({
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
            tasks: [],
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
        this.columns[2].label = this.$t('components.health.task');
        this.columns[3].label = this.$t('components.health.message');
    },
    methods: {
        async getTasks(){
            try {
                const results = await axios.get(API_ENDPOINT_TASKS);
                this.tasks = results.data;
            } catch (e) {
                console.error(e);
            }
        },
        async onRequest(props) {
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            this.loading = true;
            try {
                let url = API_ENDPOINT_STATUSES;
                url += '?order=id.desc&select=task(name),message,checked_at,id&limit=';
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
    },
};
</script>

<template>
<div class="q-mb-md tableWrapper">
    <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :row-key="row => row.id"
        :columns="columns"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50]"
        flat
        @request="onRequest"
    >
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @click="col.name==='checked_at' ? showAge =! showAge : null"
            />
            <q-tooltip v-if="col.name === 'checked_at'" anchor="bottom middle" self="bottom middle">
                {{ $t('components.health.click_to_change_format') }}
            </q-tooltip>
            {{ col.label }}
        </q-tr>

        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td key="status" :props="props">
                    <q-icon v-if="props.row.message !== ''" name="warning" color="negative"/>
                </q-td>
                <q-td key="checked_at" :props="props">{{ props.row.checked_at }}</q-td>
                <q-td key="task" :props="props">{{ props.row.task.name }}</q-td>
                <q-td key="message" :props="props">{{ props.row.message }}</q-td>
            </q-tr>
        </template>
    </q-table>
</div>
</template>

<style scoped lang='sass'>
.tableWrapper
    width: 50vw
</style>
