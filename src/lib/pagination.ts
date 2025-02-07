// Pagination

import { Router, RouteLocationNormalizedLoaded } from 'vue-router';


// this function takes current pagination values and push them to the URL
export const writePaginationToURL = (newPage: number, newRows: number, defaultSize: number, routers: {router: Router, route: RouteLocationNormalizedLoaded}) => {
    const query = { ...routers.route.query ?? {} };

    // If page is 1, remove param; otherwise set it
    if (newPage !== 1 || newRows !== defaultSize) {
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

    if (routers.router) {
        routers.router.replace({ query });
    }
};

// this function takes the URL query and updates the pagination values
export const readPaginationFromURL = (defaultSize: number, routers: {router: Router, route: RouteLocationNormalizedLoaded}) => {
    const query = routers.route.query;
    const new_pagination = {
        page: 1,
        rowsPerPage: defaultSize,
    };
    if (query?.p) {
        const p = parseInt(query.p as string, 10);
        new_pagination.page = p;
    }
    if (query?.ps) {
        const ps = parseInt(query.ps as string, 10);
        new_pagination.rowsPerPage = ps;
    }

    return new_pagination;
};
