<script>
import axios from 'axios';
const API_URL = ('' + process.env.NETWORK_EVM_CHAIN_ID + '' === '40') ? 'https://api.monitor.telos.net' : 'https://api.monitor-test.telos.net'
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
                label: this.$t('components.health.status'),
                align: 'left',
            },
            {
                name: 'checked_at',
                label: this.$t('components.health.checked_at'),
                align: 'left',
            },
            {
                name: 'task',
                label: this.$t('components.health.task'),
                align: 'left',
            },
            {
                name: 'message',
                label: this.$t('components.health.message'),
                align: 'left',
            },
        ]

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
        }
    },
    methods: {
        async getTasks(){
            try {
                const results = await axios.get(API_ENDPOINT_TASKS);
                this.tasks = results.data;
            } catch (e) {
                console.error(e)
            }
        },
        async onRequest(props) {
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            this.loading = true;
            try {
                const results = await axios.get(API_ENDPOINT_STATUSES + '?order=id.desc&select=task(name),message,checked_at,id&limit=' + rowsPerPage + '&offset=' + rowsPerPage * (page - 1));
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
                console.error(e)
            }
        },
    },
};
</script>
<template lang="pug">
.q-mb-md.tableWrapper
    q-table(
        :rows="rows"
        :row-key='row => row.id'
        :columns="columns"
        v-model:pagination="pagination"
        :loading="loading"
        @request="onRequest"
        :rows-per-page-options="[10, 20, 50]"
        flat
    )
        q-tr( slot="header" slot-scope="props" :props="props" )
            q-th(
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @click="col.name==='checked_at' ? showAge=!showAge : null"
            )
            template( v-if="col.name==='checked_at'" )
                q-tooltip(anchor="bottom middle" self="bottom middle") {{ $t('components.health.click_to_change_format') }
            | {{ col.label }}

        template(v-slot:body="props")
            q-tr( :props="props")
                q-td( key="status" :props="props" )
                    q-icon(v-if="props.row.message !== ''" name="warning" color="negative")
                q-td( key="checked_at" :props="props" ) {{ props.row.checked_at }}
                q-td( key="task" :props="props" ) {{ props.row.task.name }}
                q-td( key="message" :props="props" ) {{ props.row.message }}
</template>

<style scoped lang='sass'>
.tableWrapper
    width: 50vw
</style>
