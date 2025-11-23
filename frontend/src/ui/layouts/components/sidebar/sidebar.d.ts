export {}
import { JSXInternal } from 'preact/src/jsx'
import { GlobalLayoutProps } from '../globalLayoutProps'

interface SidebarProps {
    side?: string // defaults to "left"
    sideWidth?: string
    contentMin?: string // defaults to "50%"
    space?: string // defaults to var(--s1) A CSS `margin` value
    noStretch?: boolean // defaults to false
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'sidebar-l': GlobalLayoutProps &
                SidebarProps &
                JSXInternal.IntrinsicAttributes &
                JSXInternal.ElementChildrenAttribute
        }
    }
}
