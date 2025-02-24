<script lang="ts" setup>
import { PaginationByKey } from 'src/types';

import {
    onMounted,
    ref,
    watch,
} from 'vue';

import { useI18n } from 'vue-i18n';
const $i18n = useI18n();
const locale = $i18n.locale.value;
const { t: $t } = useI18n();

const isOnLastPage = ref(false);
const endRow = ref(0);
const isOnFirstPage = ref(true);
const startRow = ref('0');
const rowsNumber = ref('0');
// pages variables
const currentPage = ref('1');
const totalPages = ref('0');

// emits 'update' event with the new pagination state
const emit = defineEmits(['update']);

// We define the props
const props = withDefaults(
    defineProps<{
            table: string,
            entryName: string,
            position: string,
            pageOptions: number[],
            pagination: PaginationByKey,
        }>(),
    {
        table: 'not-set',
        position: 'bottom',
        entryName: 'records',
        pageOptions: () => [10, 25, 50],
        pagination: () => ({
            sortBy: 'balance',
            descending: true,
            page: 1,
            rowsPerPage: 25,
            rowsNumber: 0,
            initialKey: 0,
            key: 0,
        }),
    },
);

watch(
    () => props.pagination,
    () => {
        updatePaginationModel();
    },
    { deep: true },
);

const updatePaginationModel = () => {
    const pagination_model = props.pagination;
    isOnLastPage.value = pagination_model.page === Math.ceil(
        (pagination_model.rowsNumber ?? 0) / pagination_model.rowsPerPage,
    );
    isOnFirstPage.value = pagination_model.page <= 1;
    endRow.value = Math.min(
        pagination_model.page * pagination_model.rowsPerPage,
        pagination_model.rowsNumber ?? 0,
    ).toLocaleString(locale);
    rowsNumber.value = (pagination_model.rowsNumber ?? 0).toLocaleString(locale);
    startRow.value = ((pagination_model.rowsNumber === 0) ? 0 : (pagination_model.page - 1) * pagination_model.rowsPerPage + 1).toLocaleString(locale);
    // pages
    currentPage.value = pagination_model.page.toLocaleString(locale);
    totalPages.value = Math.ceil(pagination_model.rowsNumber / pagination_model.rowsPerPage).toLocaleString(locale);
};

onMounted(() => {
    updatePaginationModel();
});

// setPaginationChange
const setPaginationChange = (change: { pagination: PaginationByKey }) => {
    updatePaginationModel();
    emit('update', change);
};

// Go to first page
const goToFirstPage = () => {
    if (isOnFirstPage.value) {
        return;
    }
    setPaginationChange({
        pagination: {
            ...props.pagination,
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
            ...props.pagination,
            page: props.pagination.page - 1,
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
            ...props.pagination,
            page: props.pagination.page + 1,
        },
    });
};

// Go to last page
const goToLastPage = () => {
    if (isOnLastPage.value) {
        return;
    }
    const lastPage = Math.ceil(
        (props.pagination.rowsNumber ?? 0) / props.pagination.rowsPerPage,
    ) || 1;
    setPaginationChange({
        pagination: {
            ...props.pagination,
            page: lastPage,
        },
    });
};

// Called when user changes rows-per-page in the <select>
const onRowsPerPageChange = (newValue: number) => {
    setPaginationChange({
        pagination: {
            ...props.pagination,
            rowsPerPage: newValue,
            // Always reset to the first page when changing the rowsPerPage
            page: 1,
        },
    });
};

</script>

<template>
<!-- This component displays pagination controls at the bottom of a table -->
<div class="c-table-pagination">
    <div v-if="position==='top'" class="c-table-pagination__info">
        <span class="c-table-pagination__info-range">
            {{ $t('components.table_pagination.showing_items_from_x_to_y', {
                startRow,
                endRow,
                rowsNumber,
                entryName,
            }) }}
        </span>
    </div>

    <div v-if="position==='bottom'" class="c-table-pagination__page-size">
        <span class="c-table-pagination__page-size-label">{{ $t('components.table_pagination.records_per_page') }}:</span>
        <q-btn
            flat
            dense
            round
            color="default"
            :label="pagination.rowsPerPage"
            rightIcon="chevron_down"
            class="c-table-pagination__page-size-select"
            aria-haspopup="true"
            aria-label="Select rows per page"
        >
            <q-menu cover anchor="center middle">
                <q-item
                    v-for="option in pageOptions"
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

    <q-space />

    <div class="c-table-pagination__nav">
        <!-- Go to first page -->
        <q-btn
            flat
            no-caps
            :class="{
                'c-table-pagination__nav-button': true,
                'c-table-pagination__nav-button--first': true,
                'c-table-pagination__nav-button--disabled': isOnFirstPage,
            }"
            aria-label="First page"
            @click="goToFirstPage()"
        >
            {{ $t('components.table_pagination.first') }}
        </q-btn>

        <!-- Go to previous page -->
        <q-btn
            flat
            no-caps
            :class="{
                'c-table-pagination__nav-button': true,
                'c-table-pagination__nav-button--prev': true,
                'c-table-pagination__nav-button--disabled': isOnFirstPage,
            }"
            icon="chevron_left"
            aria-label="Previous page"
            @click="goToPreviousPage()"
        />

        <!-- Current page -->
        <q-btn
            flat
            no-caps
            no-ripple
            :class="{
                'c-table-pagination__nav-button': true,
                'c-table-pagination__nav-button--current': true,
                'c-table-pagination__nav-button--disabled': false,
            }"
            aria-current="page"
            aria-disabled="true"
        >
            {{ $t('components.table_pagination.current_page', {
                currentPage,
                totalPages
            }) }}
        </q-btn>

        <!-- Go to next page -->
        <q-btn
            flat
            no-caps
            :class="{
                'c-table-pagination__nav-button': true,
                'c-table-pagination__nav-button--next': true,
                'c-table-pagination__nav-button--disabled': isOnLastPage,
            }"
            icon="chevron_right"
            aria-label="Next page"
            @click="goToNextPage()"
        />

        <!-- Go to last page -->
        <q-btn
            flat
            no-caps
            :class="{
                'c-table-pagination__nav-button': true,
                'c-table-pagination__nav-button--last': true,
                'c-table-pagination__nav-button--disabled': isOnLastPage,
            }"
            aria-label="Last page"
            @click="goToLastPage()"
        >
            {{ $t('components.table_pagination.last') }}
        </q-btn>
    </div>
</div>
</template>

<style lang="scss">
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
        gap: 3px;
        & [disabled] {
            cursor: default !important;
        }
        &-button {
            padding: 4px 8px;
            font-size: 12px;
            color: var(--text-color);
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid var(--border-color);
            &:hover {
                background-color: var(--q-primary);
            }
            &--disabled {
                span.q-focus-helper {
                    background: var(--bg-mid-hover-color) !important;
                    opacity: 1 !important;
                    &::after, &::before {
                        content: none;
                    }
                }
                & > span.q-ripple {
                    display: none;
                }
                cursor: default !important;
                color: var(--disabled-text-color);
                &:hover {
                    background-color: transparent;
                }
            }
            &--current {
                background-color: var(--tab-bg-color) !important;
                transition: none !important;
                &:hover,
                &:active,
                &:focus {
                    cursor: default !important;
                    background-color: var(--tab-bg-color) !important;
                    opacity: 1 !important;
                    transition: none !important;
                }
                .q-btn__content {
                    transition: none !important;
                }
                /* Also disable internal Quasar ripple/focus helper elements */
                .q-ripple,
                .q-focus-helper,
                .q-btn__ripple {
                    display: none !important;
                }
            }
        }
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

.q-table .q-td.pagination-container {
    padding: 4px 14px;
}

</style>

