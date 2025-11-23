export {}
import { JSXInternal } from 'preact/src/jsx'
import { GlobalLayoutProps } from '../globalLayoutProps'
interface CoverProps {
    centered?: string // defaults to h1. A simple selector such an element or class selector, representing the centered (main) element in the cover
    space?: string // defaults to var(--s1). The minimum space between and around all of the child elements
    minHeight?: string // defaults to 100vh. The minimum height for the **Cover**
    noPad?: boolean // defaults to false. Whether the spacing is also applied as padding to the container element
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'cover-l': GlobalLayoutProps &
                CoverProps &
                JSXInternal.IntrinsicAttributes &
                JSXInternal.ElementChildrenAttribute
        }
    }
}
