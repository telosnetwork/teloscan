export type Pagination = {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber?: number;
}


export type PaginationByKey = {
    page: number;
    key: number;
    initialKey: number;
    descending: boolean;
    rowsPerPage: number;
    rowsNumber: number;
}
