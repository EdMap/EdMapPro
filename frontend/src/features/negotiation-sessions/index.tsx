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
        <div className={styles.wrapper}>
            {isPending ? (
                <div className={styles.spinner}>
                    <p>Loading...</p>
                </div>
            ) : isError ? (
                <div className={styles.error}>
                    <h2>Something went wrong</h2>
                    <p>{error?.message}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className={styles.title}>{title}</h3>
                        <div style={{ backgroundColor: '#2196F3', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {count}
                        </div>
                    </div>
                    <div className={styles.list}>
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
                    </div>
                    <Pagination
                        count={count}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                    />
                </>
            )}
        </div>
    )
}

export default NegotiationSessions
