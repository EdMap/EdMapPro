export enum Status {
    ERROR = 'ERROR',
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
}

export type PaginationControls = {
    limit?: number
    offset?: number
    hasMore?: boolean
}

export type Pagination = {
    pagination: PaginationControls
}
