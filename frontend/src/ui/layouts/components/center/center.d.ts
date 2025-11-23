export {}
import { JSXInternal } from 'preact/src/jsx'
import { GlobalLayoutProps } from '../globalLayoutProps'
interface CenterProps {
    max?: string // defaults to var(--measure). A CSS `max-width` value
    andText?: boolean // defaults to false. Center align the text too (`text-align: center`)
    gutters?: boolean // defaults to 0. The minimum space on either side of the content
    intrinsic?: boolean // defaults to false. Center child elements based on their content width
    role?: string
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'center-l': GlobalLayoutProps &
                CenterProps &
                JSXInternal.IntrinsicAttributes &
                JSXInternal.ElementChildrenAttribute
        }
    }
}
