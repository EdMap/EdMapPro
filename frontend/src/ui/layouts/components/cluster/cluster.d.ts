export {}
import { JSXInternal } from 'preact/src/jsx'
import { GlobalLayoutProps } from '../globalLayoutProps'

interface ClusterProps {
    justify?: string // default flex-start - A CSS `justify-content` value
    align?: string // default flex-start - A CSS `align-items` value
    space?: string // default var(--s1) - A CSS `gap` value. The minimum space between the clustered child elements.
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'cluster-l': GlobalLayoutProps &
                ClusterProps &
                JSXInternal.IntrinsicAttributes &
                JSXInternal.ElementChildrenAttribute
        }
    }
}
