import { JSXInternal } from 'preact/src/jsx'
import { GlobalLayoutProps } from '../globalLayoutProps'
interface StackProps {
    space?: string // defaults to var(--s1) A CSS `margin` value
    recursive?: boolean // defaults to false Whether the spaces apply recursively (i.e. regardless of nesting level)
    splitAfter?: number // defaults to null The element after which to _split_ the stack with an auto margin
    role?: string
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stack-l': GlobalLayoutProps &
                StackProps &
                JSXInternal.IntrinsicAttributes &
                JSXInternal.ElementChildrenAttribute
        }
    }
}
