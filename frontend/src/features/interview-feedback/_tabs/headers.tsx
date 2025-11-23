import { FC } from 'react'
import { keyify } from '../../../utils/string'

export enum InterviewFeedbackTabs {
    FEEDBACK = 'feedback',
    REVIEW_QUESTIONS = 'review-questions',
}

export type InterviewFeedbackTabsString = keyof typeof InterviewFeedbackTabs

const TabHeaders: FC<{
    isPending: boolean
}> = ({ isPending }) => {
    return (
        <>
            {(
                Object.keys(
                    InterviewFeedbackTabs,
                ) as InterviewFeedbackTabsString[]
            ).map((key) => (
                <sl-tab
                    key={keyify(key)}
                    panel={InterviewFeedbackTabs[key]}
                    disabled={isPending}
                    active={
                        InterviewFeedbackTabs.FEEDBACK ===
                        InterviewFeedbackTabs[key]
                    }
                    slot="nav"
                >
                    {(key.includes('_')
                        ? key.replace('_', ' ')
                        : key
                    )?.toLowerCase()}
                </sl-tab>
            ))}
        </>
    )
}

export default TabHeaders
