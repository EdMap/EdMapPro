import { FC } from 'react'
import { Ref, useCallback, useEffect, useState } from 'react'
import { InterviewMessage } from '../../../__generated__/api'
import { isNone } from '../../../utils/is-none'
import styles from './index.module.css'

const MESSAGES = {
    VOICE_DISABLED: 'Sending voice answers is currently not supported',
    SEND_TOOLTIP: 'Use Enter to send',
}

const ChatControls: FC<{
    messages: InterviewMessage[]
    onSend: (input: string) => void
    disabled: boolean
    formRef: Ref<HTMLFormElement | null>
}> = ({ messages, onSend, disabled, formRef }) => {
    const [input, setInput] = useState<string>('')

    const handleChange = useCallback((e: CustomEvent) => {
        const target = e.target as HTMLTextAreaElement
        setInput(target.value)
    }, [])

    const handleReset = useCallback(
        (e: Event) => {
            e.preventDefault()
            setInput('')
        },
        [setInput],
    )

    const handleSubmit = useCallback(
        (e: SubmitEvent) => {
            e.preventDefault()
            if (
                formRef.current?.reportValidity() &&
                !isNone(input) &&
                input!.trim()!.length! > 0
            ) {
                onSend(input!)
            }

            formRef.current?.reset()
        },
        [input, onSend, formRef],
    )

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
                return true
            }
        },
        [formRef],
    )

    const handleChatScroll = useCallback(() => {
        globalThis.scrollTo(0, globalThis.document.body.offsetHeight)
        formRef.current?.querySelector('sl-textarea')?.focus()
    }, [formRef])

    useEffect(() => {
        if (messages.length > 0) {
            handleChatScroll()
        }
    }, [messages, handleChatScroll])

    return (
        <form
            onSubmit={handleSubmit}
            onReset={handleReset}
            disabled={disabled}
            className={styles.controls}
            ref={formRef}
        >
            <cluster-l align="center" justify="center" space="var(--s1)">
                <sl-textarea
                    placeholder="Enter your answer"
                    size="large"
                    onInput={handleChange}
                    onKeyDown={handleKeyDown}
                    value={input}
                    required
                    disabled={disabled}
                    rows={3}
                />
                <sl-tooltip placement="right-end" disabled={disabled}>
                    <span slot="content">{MESSAGES.SEND_TOOLTIP}</span>
                    <sl-button
                        className={styles.send}
                        variant="primary"
                        type="submit"
                        disabled={disabled}
                    >
                        <sl-icon slot="suffix" name="send" />
                    </sl-button>
                </sl-tooltip>
                <sl-tooltip placement="right-end">
                    <span slot="content">{MESSAGES.VOICE_DISABLED}</span>
                    <sl-button
                        variant="primary"
                        outline
                        disabled={disabled || true}
                    >
                        <sl-icon slot="suffix" name="mic" />
                    </sl-button>
                </sl-tooltip>
            </cluster-l>
        </form>
    )
}

export default ChatControls
