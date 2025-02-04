<script lang="ts" setup>
// Import reactive shared pagination state and helper methods
import {
    pagination,
    default_rows_per_page_options,
    onPaginationChange,
    setRouterInstances,
    // setRouterInstances,
} from 'src/lib/pagination';
import { Pagination } from 'src/types';
// import { useRouter, useRoute } from 'vue-router';

import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Available rows per page options (10, 25, 50, etc.)
const rowsPerPageOptions = default_rows_per_page_options;
const isOnLastPage = ref(false);
const endRow = ref(0);
const isOnFirstPage = ref(true);
const startRow = ref(0);

// Internal pagination model
const pagination_model = {
    sortBy: 'balance',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
};

watch(
    () => pagination.value,
    () => {
        updatePaginationModel();
    },
);

const updatePaginationModel = () => {
    pagination_model.page = pagination.value.page;
    pagination_model.rowsPerPage = pagination.value.rowsPerPage;
    pagination_model.rowsNumber = pagination.value.rowsNumber || 0;
    isOnLastPage.value = pagination_model.page === Math.ceil(
        (pagination_model.rowsNumber ?? 0) / pagination_model.rowsPerPage,
    );
    endRow.value = Math.min(
        pagination_model.page * pagination_model.rowsPerPage,
        pagination_model.rowsNumber ?? 0,
    );
    isOnFirstPage.value = pagination_model.page <= 1;
    startRow.value = (pagination_model.rowsNumber === 0) ? 0 : (pagination_model.page - 1) * pagination_model.rowsPerPage + 1;
};


onMounted(() => {
    updatePaginationModel();
});

// setPaginationChange
const setPaginationChange = (props: { pagination: Pagination }) => {
    onPaginationChange(props);
    updatePaginationModel();
};

// Go to first page
const goToFirstPage = () => {
    if (isOnFirstPage.value) {
        return;
    }
    setPaginationChange({
        pagination: {
            ...pagination.value,
            page: 1,
        },
    });
};

// Go to previous page
const goToPreviousPage = () => {
    if (isOnFirstPage.value) {
        return;
    }
    setPaginationChange({
        pagination: {
            ...pagination.value,
            page: pagination.value.page - 1,
        },
    });
};

// Go to next page
const goToNextPage = () => {
    if (isOnLastPage.value) {
        return;
    }
    setPaginationChange({
        pagination: {
            ...pagination.value,
            page: pagination.value.page + 1,
        },
    });
};

// Go to last page
const goToLastPage = () => {
    if (isOnLastPage.value) {
        return;
    }
    const lastPage = Math.ceil(
        (pagination.value.rowsNumber ?? 0) / pagination.value.rowsPerPage,
    ) || 1;
    setPaginationChange({
        pagination: {
            ...pagination.value,
            page: lastPage,
        },
    });
};

// Called when user changes rows-per-page in the <select>
const onRowsPerPageChange = (newValue: number) => {
    setPaginationChange({
        pagination: {
            ...pagination.value,
            rowsPerPage: newValue,
            // Always reset to the first page when changing the rowsPerPage
            page: 1,
        },
    });
};

onMounted(() => {
    setRouterInstances(useRouter(), useRoute());
});

</script>

<template>
<!-- This component displays pagination controls at the bottom of a table -->
<div class="c-table-pagination">
    <div class="c-table-pagination__page-size">
        <span class="c-table-pagination__page-size-label">Records per page:</span>
        <q-btn
            flat
            dense
            round
            color="default"
            :label="pagination.rowsPerPage"
            rightIcon="chevron_down"
            class="c-table-pagination__page-size-select"
        >
            <q-menu cover anchor="center middle">
                <q-item
                    v-for="option in rowsPerPageOptions"
                    :key="option"
                    clickable
                    @click="onRowsPerPageChange(option)"
                >
                    <q-item-section>{{ option }}</q-item-section>
                </q-item>
            </q-menu>
            <i class="q-icon notranslate material-icons q-select__dropdown-icon" aria-hidden="true" role="presentation">arrow_drop_down</i>
        </q-btn>
    </div>

    <div class="c-table-pagination__info">
        <span class="c-table-pagination__info-range">
            {{ startRow }}-{{ endRow }} of {{ pagination.rowsNumber }}
        </span>
    </div>

    <div class="c-table-pagination__nav">
        <!-- Go to first page -->
        <q-btn
            flat
            dense
            round
            class="c-table-pagination__nav-button c-table-pagination__nav-button--first"
            :disabled="pagination.page === 1"
            icon="first_page"
            @click="goToFirstPage()"
        />

        <!-- Go to previous page -->
        <q-btn
            flat
            dense
            round
            class="c-table-pagination__nav-button c-table-pagination__nav-button--prev"
            :disabled="pagination.page === 1"
            icon="chevron_left"
            @click="goToPreviousPage()"
        />

        <!-- Go to next page -->
        <q-btn
            flat
            dense
            round
            class="c-table-pagination__nav-button c-table-pagination__nav-button--next"
            icon="chevron_right"
            @click="goToNextPage()"
        />

        <!-- Go to last page -->
        <q-btn
            flat
            dense
            round
            class="c-table-pagination__nav-button c-table-pagination__nav-button--last"
            icon="last_page"
            @click="goToLastPage()"
        />
    </div>
</div>
</template>

<style scoped lang="scss">
.c-table-pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 12px;

    &__page-size {
        display: flex;
        align-items: center;
        margin-right: 9px;

        &-label {
            margin-right: 6px;
        }

        &-select {
            padding-left: 5px;
        }
    }

    &__info {
        margin-right: 16px;

        &-range {
            font-weight: 400;
        }
    }

    &__nav {
        display: flex;
        align-items: center;
        color: var(--pagination-buttons-color);
    }

    &__page-size-select {
        .q-focus-helper {
            display: none;
        }
    }

    .q-select__dropdown-icon {
        padding-right: 7px;
        padding-left: 6px;
    }
}
</style>

