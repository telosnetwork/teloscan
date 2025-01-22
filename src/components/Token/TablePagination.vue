<script lang="ts" setup>
// Import reactive shared pagination state and helper methods
import {
    pagination,
    default_rows_per_page_options,
    onPaginationChange,
    setRouterInstances,
} from 'src/lib/pagination';
import { useRouter, useRoute } from 'vue-router';

import { computed } from 'vue';

// Available rows per page options (10, 25, 50, etc.)
const rowsPerPageOptions = default_rows_per_page_options;

// Compute the first row number displayed on the current page
const startRow = computed(() => {
    if (pagination.value.rowsNumber === 0) {
        return 0;
    }
    return (pagination.value.page - 1) * pagination.value.rowsPerPage + 1;
});

// Compute the last row number displayed on the current page
const endRow = computed(() => Math.min(
    pagination.value.page * pagination.value.rowsPerPage,
    pagination.value.rowsNumber ?? 0,
));

// Check if we are on the first page
const isOnFirstPage = computed(() => pagination.value.page <= 1);

// Check if we are on the last page
const isOnLastPage = computed(() => {
    const lastPage = Math.ceil(
        (pagination.value.rowsNumber ?? 0)/ pagination.value.rowsPerPage,
    ) || 1;
    return pagination.value.page >= lastPage;
});

// Go to first page
const goToFirstPage = () => {
    if (isOnFirstPage.value) {
        return;
    }
    onPaginationChange({
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
    onPaginationChange({
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
    onPaginationChange({
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
    onPaginationChange({
        pagination: {
            ...pagination.value,
            page: lastPage,
        },
    });
};

// Called when user changes rows-per-page in the <select>
const onRowsPerPageChange = (event: number) => {
    console.log('TablePagination.onRowsPerPageChange()', { event });
    const newValue = event;
    onPaginationChange({
        pagination: {
            ...pagination.value,
            rowsPerPage: newValue,
            // Always reset to the first page when changing the rowsPerPage
            page: 1,
        },
    });
};

setRouterInstances(useRouter(), useRoute());

</script>

<template>
<!-- This component displays pagination controls at the bottom of a table -->
<div class="c-table-pagination">
    <div class="c-table-pagination__page-size">
        <span class="c-table-pagination__page-size-label">Records per page:</span>
        <!--select
            class="c-table-pagination__page-size-select"
            :value="pagination.rowsPerPage"
            @change="onRowsPerPageChange($event)"
        >
            <option
                v-for="option in rowsPerPageOptions"
                :key="option"
                :value="option"
            >
                {{ option }}
            </option>
        </select-->
        <q-btn
            flat
            dense
            round
            color="primary"
            :label="pagination.rowsPerPage"
            rightIcon="chevron_down"
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
        <!-- <q-btn push color="white" text-color="primary" round icon="card_giftcard" /> -->
        <q-btn
            flat
            dense
            round
            :disabled="pagination.page === 1"
            icon="first_page"
            @click="goToFirstPage()"
        />

        <!-- Go to previous page -->
        <q-btn
            flat
            dense
            round
            :disabled="pagination.page === 1"
            icon="chevron_left"
            @click="goToPreviousPage()"
        />

        <!-- Go to next page -->
        <q-btn
            flat
            dense
            round
            icon="chevron_right"
            @click="goToNextPage()"
        />

        <!-- Go to last page -->
        <q-btn
            flat
            dense
            round
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
        margin-right: 16px;

        &-label {
            margin-right: 6px;
        }

        &-select {
            padding: 4px 8px;
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

        &-button {
            margin: 0 3px;
            padding: 4px 8px;
            cursor: pointer;
            border: 1px solid #ccc;
            background: #333;
            color: #fff;
            border-radius: 4px;

            &:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            /* BEM variants for different arrows */
            // &--first {
            // }
            // &--prev  {
            // }
            // &--next  {
            // }
            // &--last  {
            // }
        }
    }
}
</style>

