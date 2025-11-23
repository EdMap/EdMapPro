import { Ref } from 'preact'
import { CSSProperties } from 'preact/compat'
export interface GlobalLayoutProps {
    class?: string
    className?: string
    onClick?: () => unknown
    ref?: Ref<HTMLElement>
    style?: CSSProperties
    title?: string
    slot?: string
    role?: string
}
