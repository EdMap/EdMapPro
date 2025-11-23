import { FC } from 'react'
import { PAGINATION_LIMITS } from '../../features/app/_store/constants'
import { type PaginationControls } from '../../features/app/_store/state'
import Limiter from './limiter'
import Pager from './pager'
import styles from './pagination.module.css'

interface PaginationControlsProps {
    count: number
    pagination: PaginationControls
    onPaginationChange: (
        p: Pick<PaginationControls, 'offset' | 'limit'>,
    ) => void
}

const Pagination: FC<PaginationControlsProps> = ({
    count,
    pagination,
    onPaginationChange,
}) => {
    const { hasMore, limit, offset } = pagination

    if (count < 1) return null

    return (
        <center-l andText class={styles.pagination} data-landmark>
            <Pager
                count={count}
                hasMore={hasMore}
                limit={limit}
                offset={offset}
                onOffsetChange={(offset) => {
                    onPaginationChange({ offset })
                }}
            >
                <Limiter
                    count={count}
                    limit={limit}
                    limits={PAGINATION_LIMITS}
                    offset={offset}
                    onLimitChange={(limit) => {
                        onPaginationChange({ limit, offset: 0 })
                    }}
                />
            </Pager>
        </center-l>
    )
}

export default Pagination
