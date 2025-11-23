import { FC } from 'react'
import {
    MessageOwnerTypeEnum,
    type InterviewMessage,
} from '../../../__generated__/api'
import CircleIcon from '../../../components/circle-icon'
import TypingDots from '../../../components/typing-dots'
import { isNone } from '../../../utils/is-none'
import { PENDING_MESSAGE } from '../_store/reducer'
import styles from './index.module.css'

const InterviewMessage: FC<{
    message: InterviewMessage
    showQuestionReason: boolean
    isPending: boolean
}> = ({ message, showQuestionReason }) => {
    const isMessageLoading =
        message.id === PENDING_MESSAGE.id &&
        message.text === PENDING_MESSAGE.text
    const isOwnerGpt = message.message_owner_type === MessageOwnerTypeEnum.Gpt
    const owner = isOwnerGpt ? 'HR Manager' : 'You'

    const wrapperCls = `${styles.wrapper} ${styles[message.message_owner_type]}`
    const isNoQuestionReason = isNone(message.question_reason)

    const showTooltip = !isNoQuestionReason && showQuestionReason

    return (
        <cluster-l class={wrapperCls}>
            <stack-l space="var(--s-2)">
                <cluster-l
                    align="flex-start"
                    space="var(--s-2)"
                    class={styles.name}
                >
                    <CircleIcon icon="person" variant="primary" size="small" />
                    {owner}
                </cluster-l>
                <sl-tooltip
                    disabled={!showTooltip}
                    placement="top-end"
                    trigger={showTooltip ? 'click' : ''}
                    class={`${styles.tooltip} ${!showTooltip ? styles.hidden : ''}`}
                    skidding={200}
                    distance={20}
                    hoist
                >
                    {showTooltip ? (
                        <stack-l slot="content" space="var(--s1)">
                            <cluster-l
                                class={styles.header}
                                align="center"
                                justify="space-between"
                            >
                                <cluster-l
                                    justify="flex-start"
                                    align="center"
                                    space="var(--s-1)"
                                >
                                    <sl-icon
                                        name="check2-circle"
                                        variant="success"
                                    />
                                    <h3>Question Breakdown</h3>
                                </cluster-l>

                                <sl-icon variant="neutral" name="x"></sl-icon>
                            </cluster-l>

                            <span>{message.question_reason}</span>
                        </stack-l>
                    ) : null}

                    <div class={styles.text}>
                        {isMessageLoading ? <TypingDots /> : message.text}
                    </div>
                </sl-tooltip>
            </stack-l>
        </cluster-l>
    )
}

export default InterviewMessage
