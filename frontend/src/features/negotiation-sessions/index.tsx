import { useCallback, useLayoutEffect } from 'react'
import { useDispatch } from 'react-redux'
import { SessionStatusEnum } from '../../__generated__/api'
import HistoryItem from '../../components/history-item'
import Pagination from '../../components/pagination'
import { keyify } from '../../utils/string'
import { RootDispatch } from '../app/_store'
import { PaginationControls, Status } from '../app/_store/state'
import navigation from '../app/navigation'
import { DashboardTabs } from '../dashboard/models'
import {
    resetNegotiationSessions,
    setNegotiationSessionsPagination,
} from './_store/reducer'
import { initialNegotiationSessionsPagination } from './_store/state'
import useNegotiationSessions from './_store/use-negotiation-sessions'
import styles from './index.module.css'

const NegotiationSessions = () => {
    const { status, error, data, pagination } = useNegotiationSessions()
    const dispatch = useDispatch<RootDispatch>()

    const isPending = status === Status.PENDING
    const isError = status === Status.ERROR
    const count = data && data?.length ? data?.length : 0

    const title = DashboardTabs.NEGOTIATION_SESSIONS?.replace('-', ' ')

    useLayoutEffect(() => {
        dispatch(
            setNegotiationSessionsPagination({
                ...initialNegotiationSessionsPagination,
            }),
        )

        return () => {
            dispatch(resetNegotiationSessions())
        }
    }, [dispatch])

    const handlePaginationChange = useCallback(
        (p: Pick<PaginationControls, 'offset' | 'limit'>) => {
            dispatch(setNegotiationSessionsPagination(p))
        },
        [dispatch],
    )

    return (
        <cover-l class={styles.wrapper}>
            {isPending ? (
                <center-l andText>
                    <sl-spinner></sl-spinner>
                </center-l>
            ) : isError ? (
                <center-l>
                    <stack-l space="var(--s-2)">
                        <h2>Something went wrong</h2>
                        <p>{error?.message}</p>
                    </stack-l>
                </center-l>
            ) : (
                <>
                    <stack-l space="var(--s0)">
                        <cluster-l justify="space-between">
                            <h3 class={styles.title}>{title}</h3>
                            <sl-badge pill variant="primary">
                                {count}
                            </sl-badge>
                        </cluster-l>
                        <stack-l space="var(--s-1)">
                            {data?.map((d) => (
                                <HistoryItem
                                    key={keyify(d.session_id)}
                                    data={d}
                                    prefix="Offer Negotiation"
                                    onNavigation={
                                        d.session_status ===
                                        SessionStatusEnum.Done
                                            ? navigation.goToNegotiationFeedbackPage
                                            : navigation.goToNegotiationDetailsPage
                                    }
                                />
                            ))}
                        </stack-l>
                    </stack-l>
                    <Pagination
                        count={count}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                    />
                </>
            )}
        </cover-l>
    )
}

export default NegotiationSessions
