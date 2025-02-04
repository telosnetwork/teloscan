// Pagination

import { Pagination } from 'src/types';
import { Ref, ref, watch } from 'vue';
import { Router, RouteLocationNormalizedLoaded } from 'vue-router';

export const internal_pagination: Pagination = {
    sortBy: 'balance',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
};

export const pagination = ref<Pagination>({ ...internal_pagination });

// default pagination options
export const default_rows_per_page_options = [10, 25, 50];
export const default_rows_per_pages = 25;

const router: Ref<Router | null> = ref(null);
const route: Ref<RouteLocationNormalizedLoaded | null> = ref(null);

export const setRouterInstances = (rr: Router, rt: RouteLocationNormalizedLoaded) => {
    router.value = rr;
    route.value = rt;
    checkRouters();
};

// check if router instances are set
const checkRouters = () => {
    if (!router.value || !route.value) {
        throw new Error('Router instances are not set');
    }
};

// this function takes current pagination values and push them to the URL
export const updateUrlParams = (newPage: number, newRows: number) => {
    checkRouters();
    const query = { ...route.value?.query ?? {} };


    // If page is 1, remove param; otherwise set it
    if (newPage !== 1 || newRows !== default_rows_per_pages) {
        // only if they are different from each other
        if (query.p !== newPage.toString()) {
            query.p = newPage.toString();
        }
        if (query.ps !== newRows.toString()) {
            query.ps = newRows.toString();
        }
    } else {
        delete query.p;
        delete query.ps;
    }

    if (router.value) {
        router.value.replace({ query });
    }
};

// this function takes the URL query and updates the pagination values
export const takeUrlParams = () => {
    checkRouters();
    const query = route.value?.query;
    let dirty = false;
    if (query?.p) {
        const p = parseInt(query.p as string, 10);
        if (p !== internal_pagination.page) {
            internal_pagination.page = p;
            dirty = true;
        }
    } else {
        dirty = true;
        internal_pagination.page = 1;
    }
    if (query?.ps) {
        const ps = parseInt(query.ps as string, 10);
        if (ps !== internal_pagination.rowsPerPage) {
            dirty = true;
            internal_pagination.rowsPerPage = ps;
        }
    } else {
        dirty = true;
        internal_pagination.rowsPerPage = default_rows_per_pages;
    }

    if (dirty) {
        const value = { ...internal_pagination };
        pagination.value = value;
    }
};

export const onPaginationChange = (props: { pagination: Pagination }) => {
    if (
        internal_pagination.page === props.pagination.page &&
        internal_pagination.rowsPerPage === props.pagination.rowsPerPage &&
        internal_pagination.sortBy === props.pagination.sortBy &&
        internal_pagination.descending === props.pagination.descending
    ) {
        // No change
        return;
    }
    // internal_pagination.page = props.pagination.page;
    internal_pagination.page = props.pagination.page;
    internal_pagination.rowsPerPage = props.pagination.rowsPerPage;
    pagination.value.rowsNumber = internal_pagination.rowsNumber;
    pagination.value.rowsPerPage = internal_pagination.rowsPerPage;
    pagination.value.descending = internal_pagination.descending;
    pagination.value.sortBy = internal_pagination.sortBy;
    pagination.value.page = props.pagination.page;
    updateUrlParams(props.pagination.page, props.pagination.rowsPerPage);
};


// set pagination total number
export const setPaginationTotalNumber = (total: number) => {
    internal_pagination.rowsNumber = total;
    onPaginationChange({
        pagination: {
            ...internal_pagination,
        },
    });
};

// Update URL query if pagination changes
watch(
    () => [route.value?.query],
    () => {
        if (route.value?.query) {
            if (
                internal_pagination.page === +(route.value?.query?.p ?? '') &&
                internal_pagination.rowsPerPage === +(route.value?.query?.ps ?? '')
            ) {
                // No change
                return;
            }
            takeUrlParams();
        }
    },
    { deep: true, immediate: true },
);
