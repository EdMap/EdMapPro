import { FC } from 'react'
import { useCallback } from 'react'
import {
    SessionDto,
    SessionStatusEnum,
    SimulationSessions,
} from '../../__generated__/api'
import { Variant } from '../../ui/shoelace/shoelace'
import { formatDate } from '../../utils/date'
import { toCareerChoice, toSeniorityChoice } from '../../utils/models'
import styles from './index.module.css'

const toSessionStatusVariant = {
    [SessionStatusEnum.Started]: 'neutral',
    [SessionStatusEnum.Done]: 'primary',
}

const toSessionStatusIcon = {
    [SessionStatusEnum.Started]: 'arrow-repeat-circle-fill',
    [SessionStatusEnum.Done]: 'check-circle-fill',
}

const HistoryItem: FC<{
    data: SimulationSessions
    prefix?: string
    onNavigation: (s: SessionDto['session_id']) => void
}> = ({ data, onNavigation, prefix }) => {
    const career = toCareerChoice[data.career]
    const seniority = toSeniorityChoice[data.seniority_level]
    const date = formatDate(data.creation_date)

    const handleNavigation = useCallback(
        (e: Event) => {
            e.stopImmediatePropagation()
            onNavigation(data.session_id)
        },
        [onNavigation, data],
    )
    return (
        <sl-card class={styles.wrapper}>
            <div slot="header">
                <i>{data?.session_id?.slice(0, 10)}</i>
            </div>

            <div onClick={handleNavigation}>
                <stack-l space="var(--s-1)">
                    <h4>
                        {prefix} Session for {seniority} {career}
                    </h4>

                    <cluster-l align="center" space="var(--s-5)">
                        <sl-tooltip content="Started At">
                            <sl-icon name="calendar-event"></sl-icon>
                        </sl-tooltip>
                        <p>{date}</p>
                    </cluster-l>
                </stack-l>

                <cluster-l justify="flex-end" class={styles.footer}>
                    <cluster-l
                        class={styles.status}
                        space="var(--s-3)"
                        align="center"
                    >
                        <sl-icon
                            name={
                                toSessionStatusIcon[
                                    data?.session_status ??
                                        SessionStatusEnum.Started
                                ]
                            }
                            variant={
                                toSessionStatusVariant[
                                    data?.session_status ??
                                        SessionStatusEnum.Started
                                ] as Variant
                            }
                        />

                        <em>{data.session_status}</em>
                    </cluster-l>
                </cluster-l>
            </div>
        </sl-card>
    )
}

export default HistoryItem
