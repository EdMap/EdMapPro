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
    resetInterviewSessions,
    setInterviewSessionsPagination,
} from './_store/reducer'
import { initialInterviewSessionPagination } from './_store/state'
import useInterviewSessions from './_store/use-interview-sessions'
import styles from './index.module.css'

const InterviewSessions = () => {
    const { status, error, data, pagination } = useInterviewSessions()
    const dispatch = useDispatch<RootDispatch>()

    const isPending = status === Status.PENDING
    const isError = status === Status.ERROR
    const count = data && data?.length ? data?.length : 0

    const title = DashboardTabs.INTERVIEW_SESSIONS?.replace('-', ' ')

    useLayoutEffect(() => {
        dispatch(
            setInterviewSessionsPagination({
                ...initialInterviewSessionPagination,
            }),
        )

        return () => {
            dispatch(resetInterviewSessions())
        }
    }, [dispatch])

    const handlePaginationChange = useCallback(
        (p: Pick<PaginationControls, 'offset' | 'limit'>) => {
            dispatch(setInterviewSessionsPagination(p))
        },
        [dispatch],
    )

    return (
        <cover-l className={styles.wrapper}>
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
                            <h3 className={styles.title}>{title}</h3>
                            <sl-badge pill variant="primary">
                                {count}
                            </sl-badge>
                        </cluster-l>
                        <stack-l space="var(--s-1)">
                            {data?.map((d) => (
                                <HistoryItem
                                    key={keyify(d.session_id)}
                                    data={d}
                                    prefix="Interview"
                                    onNavigation={
                                        d.session_status ===
                                        SessionStatusEnum.Done
                                            ? navigation.goToInterviewFeedbackPage
                                            : navigation.goToInterviewDetailsPage
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

export default InterviewSessions
