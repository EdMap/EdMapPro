import { FunctionComponent } from 'preact'
import { keyify } from '../../../utils/string'

export enum NegotiationFeedbackTabs {
    FEEDBACK = 'feedback',
    OFFER = 'offer',
    REVIEW_QUESTIONS = 'review-questions',
}

export type NegotiationFeedbackTabsString = keyof typeof NegotiationFeedbackTabs

const TabHeaders: FunctionComponent<{
    isPending: boolean
}> = ({ isPending }) => {
    return (
        <>
            {(
                Object.keys(
                    NegotiationFeedbackTabs,
                ) as NegotiationFeedbackTabsString[]
            ).map((key) => (
                <sl-tab
                    key={keyify(key)}
                    panel={NegotiationFeedbackTabs[key]}
                    disabled={isPending}
                    active={
                        NegotiationFeedbackTabs.FEEDBACK ===
                        NegotiationFeedbackTabs[key]
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
