import { FunctionComponent } from 'preact'
import { Variant } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

const ICON_VARIANT_MAP = {
    danger: {
        name: 'exclamation-octagon-fill',
    },
    neutral: {
        name: 'gear-fill',
    },
    primary: {
        name: 'info-circle-fill',
    },
    success: {
        name: 'check-circle-fill',
    },
    warning: {
        name: 'exclamation-triangle-fill',
    },
    text: {
        name: '',
    },
    default: {
        name: '',
    },
}

const HelpText: FunctionComponent<{
    variant?: Variant | null
    text: string
    tooltip?: string
    slot?: string
}> = ({ variant, text, slot, tooltip, children, ...props }, ref) => {
    const iconType = ICON_VARIANT_MAP[variant ?? 'neutral']
    const shortText =
        (text ?? '').length > 50 ? `${(text ?? '').substring(0, 47)}...` : text

    return (
        <sl-tooltip
            slot={slot}
            content={tooltip ?? text}
            placement="bottom-start"
            class={styles.tooltip}
        >
            {children}
            <cluster-l
                class={`${styles.helpText} ${styles[variant ?? 'neutral']}`}
                align="center"
                space="var(--s-3)"
                ref={ref}
                {...props}
            >
                <sl-icon name={iconType.name} />
                <span class="ellipsis">{shortText}</span>
            </cluster-l>
        </sl-tooltip>
    )
}

export default HelpText
