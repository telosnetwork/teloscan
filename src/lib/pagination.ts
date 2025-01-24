// Pagination

import { Pagination } from 'src/types';
import { Ref, ref, toRaw, watch } from 'vue';
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
    console.log('pagination.setRouterInstances()', { rr, rt });
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

    console.log('pagination.updateUrlParams()', { newPage, newRows });

    // If page is 1, remove param; otherwise set it
    if (newPage !== 1 || newRows !== default_rows_per_pages) {
        // only if they are different from each other
        if (query.p !== newPage.toString()) {
            query.p = newPage.toString();
            console.log('pagination.updateUrlParams() -> query.p: ', query.p);
        }
        if (query.ps !== newRows.toString()) {
            query.ps = newRows.toString();
            console.log('pagination.updateUrlParams() -> query.ps: ', query.ps);
        }
    } else {
        delete query.p;
        delete query.ps;
    }

    if (router.value) {
        console.log('pagination.updateUrlParams() -->', { query });
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
            console.log('pagination.takeUrlParams() -> page: ', internal_pagination.page);
        }
    } else {
        console.log('pagination.takeUrlParams() -> page: 1');
        dirty = true;
        internal_pagination.page = 1;
    }
    if (query?.ps) {
        const ps = parseInt(query.ps as string, 10);
        if (ps !== internal_pagination.rowsPerPage) {
            dirty = true;
            internal_pagination.rowsPerPage = ps;
            console.log('pagination.takeUrlParams() -> rowsPerPage: ', internal_pagination.rowsPerPage);
        }
    } else {
        console.log('pagination.takeUrlParams() -> rowsPerPage: default');
        dirty = true;
        internal_pagination.rowsPerPage = default_rows_per_pages;
    }

    if (dirty) {
        const value = { ...internal_pagination };
        console.log('pagination.takeUrlParams() ---> final', value);
        pagination.value = value;
    }
};

export const onPaginationChange = (props: { pagination: Pagination }) => {
    console.log('pagination.onPaginationChange()', {
        rowsNumber: props.pagination.rowsNumber,
        props_pagination: props.pagination,
        rowsPerPage: pagination.value.rowsPerPage,
        page: pagination.value.page,
    });
    if (
        internal_pagination.page === props.pagination.page &&
        internal_pagination.rowsPerPage === props.pagination.rowsPerPage &&
        internal_pagination.sortBy === props.pagination.sortBy &&
        internal_pagination.descending === props.pagination.descending
    ) {
        // No change
        console.log('pagination.onPaginationChange() No change');
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
    console.log('pagination.onPaginationChange() pagination.value: ', { pagination: toRaw(pagination.value) });
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
            console.log('pagination.watch(route.query)', { query: route.value?.query, rowsPerPage: pagination.value.rowsPerPage, page: pagination.value.page });
            if (
                internal_pagination.page === +(route.value?.query?.p ?? '') &&
                internal_pagination.rowsPerPage === +(route.value?.query?.ps ?? '')
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
