// Pagination

import { Pagination } from 'src/types';
import { Ref, ref, watch } from 'vue';
import { Router, RouteLocationNormalizedLoaded } from 'vue-router';

export const internal_pagination = ref<Pagination>({
    sortBy: 'balance',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
});

export const pagination = ref<Pagination>({ ...internal_pagination.value });

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
export const updateUrlParams = () => {
    checkRouters();
    const query = { ...route.value?.query ?? {} };
    const newPage = pagination.value.page;
    const newRows = pagination.value.rowsPerPage;

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

    console.log('pagination.updateUrlParams()', { query });

    router.value?.replace({ query });
};

// this function takes the URL query and updates the pagination values
export const takeUrlParams = () => {
    checkRouters();
    const query = route.value?.query;
    if (query?.p) {
        pagination.value.page = parseInt(query.p as string, 10);
    } else {
        pagination.value.page = 1;
    }
    if (query?.ps) {
        pagination.value.rowsPerPage = parseInt(query.ps as string, 10);
    } else {
        pagination.value.rowsPerPage = default_rows_per_pages;
    }
    console.log('pagination.takeUrlParams()', { query, pagination: pagination.value });
};

const last_pagination: Pagination = { ...pagination.value };

export const onPaginationChange = (props: { pagination: Pagination }) => {
    console.log('pagination.onPaginationChange()', { props_pagination: props.pagination, pagination: pagination.value });
    if (
        last_pagination.page === props.pagination.page &&
        last_pagination.rowsPerPage === props.pagination.rowsPerPage &&
        last_pagination.sortBy === props.pagination.sortBy &&
        last_pagination.descending === props.pagination.descending
    ) {
        // No change
        console.log('pagination.onPaginationChange() No change');
        return;
    }
    pagination.value.page = props.pagination.page;
    pagination.value.rowsPerPage = props.pagination.rowsPerPage;
    pagination.value.rowsNumber = props.pagination.rowsNumber;
    pagination.value.sortBy = props.pagination.sortBy;
    pagination.value.descending = props.pagination.descending;
    updateUrlParams();
};

// Update URL query if pagination changes
watch(
    () => [route.value?.query],
    () => {
        if (route.value?.query) {
            console.log('pagination.watch(route.query)', { query: route.value?.query, pagination: pagination.value });
            if (
                last_pagination.page === +(route.value?.query?.p ?? '') &&
                last_pagination.rowsPerPage === +(route.value?.query?.ps ?? '')
            ) {
                // No change
                console.log('pagination.watch(route.query) No change');
                return;
            }
            takeUrlParams();
        }
    },
    { deep: true, immediate: true },
);
