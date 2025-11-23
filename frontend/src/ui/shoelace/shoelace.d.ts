import { SlRadioGroup } from '@shoelace-style/shoelace'
import { SlAlert } from '@shoelace-style/shoelace/dist/react/alert'
import { SlCard } from '@shoelace-style/shoelace/dist/react/card'
import { SlCheckbox } from '@shoelace-style/shoelace/dist/react/checkbox'
import { SlDialog } from '@shoelace-style/shoelace/dist/react/dialog'
import { SlSkeleton } from '@shoelace-style/shoelace/dist/react/skeleton'
import { SlTooltip } from '@shoelace-style/shoelace/dist/react/tooltip'
import { ReactNode } from 'react'
import { Ref } from 'react'
import { JSXInternal } from 'preact/src/jsx'

type WebComponentAttributes = JSX.IntrinsicAttributes &
    Partial<JSX.ElementChildrenAttribute> & {
        class?: string | undefined
        slot?: string
        style?: string | JSXInternal.CSSProperties | undefined
    }

type Size = 'small' | 'medium' | 'large'
type Variant =
    | 'primary'
    | 'success'
    | 'neutral'
    | 'warning'
    | 'danger'
    | 'text'
    | 'default'

type SkeletonEffect = 'pulse' | 'sheen' | 'none'
type Placement = 'top' | 'end' | 'bottom' | 'start'
type DropdownPlacement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end'

interface SlAlertProps {
    closable?: boolean
    duration?: string
    open?: boolean
    ref?: Ref<SlAlert | undefined>
    variant?: Variant
}

interface SlAvatarProps {
    initials?: string
    shape?: 'circle' | 'square' | 'rounded'
    image?: string
    loading?: 'eager' | 'lazy'
}

interface SlBadgeProps {
    pill?: true
    variant?: Variant
}

interface SlButtonProps {
    caret?: boolean
    circle?: true
    disabled?: boolean
    loading?: boolean
    pill?: true
    outline?: true
    size?: Size
    submit?: true
    type?: 'button' | 'submit'
    variant?: Variant
    onClick?: JSXInternal.MouseEventHandler<HTMLButtonElement>
}

interface SlButtonGroupProps {
    label?: string
}

interface SlCardProps {
    class?: string
    name?: string
    ref?: Ref<SlCard | undefined>
    onClick?: (e: Event) => void
}

interface SlCheckboxProps {
    input?: HTMLInputElement
    name?: string
    value?: string
    disabled?: boolean
    required?: boolean
    checked?: boolean
    indeterminate?: boolean
    invalid?: boolean
    ref?: Ref<SlCheckbox | undefined>
}

interface SlDialogProps {
    label?: string
    open?: boolean
    ref?: Ref<SlDialog | undefined>
}

interface SlDrawerProps {
    contained?: boolean
    label?: string
    noHeader?: boolean
    open?: boolean
    placement?: Placement
}

interface SlDropDownProps {
    containingElement?: HTMLElement
    disabled?: boolean
    distance?: number
    hoist?: boolean
    open?: boolean
    panel?: HTMLElement
    placement?: DropdownPlacement
    positioner?: HTMLElement
    trigger?: HTMLElement
    skidding?: number
    stayOpenOnSelect?: boolean
    handleOpenChange?(): Promise<void>
    hide?(): Promise<void>
    show?(): Promise<void>
}

interface SlIconProps {
    name?: string
    variant?: Variant
    src?: string
}

interface SlIconButtonProps extends SlButtonProps {
    name?: string
    onFocus?: JSXInternal.FocusEventHandler<HTMLButtonElement>
}

interface SlInputProps
    extends JSXInternal.DOMAttributes<HTMLInputElement>,
        Omit<JSXInternal.HTMLAttributes<HTMLInputElement>, 'size'> {
    'size'?: Size
    'type'?:
        | 'date'
        | 'email'
        | 'number'
        | 'password'
        | 'search'
        | 'tel'
        | 'text'
        | 'url'
    'name'?: string
    'value'?: string
    'filled'?: boolean
    'pill'?: boolean
    'label'?: string
    'helpText'?: string
    'clearable'?: boolean
    'togglePassword'?: boolean
    'placeholder'?: string
    'disabled'?: boolean
    'readonly'?: boolean
    'minlength'?: number
    'maxlength'?: number
    'min'?: number | string
    'max'?: number | string
    'step'?: number
    'pattern'?: string
    'required'?: boolean
    'invalid'?: boolean
    'autocapitalize'?:
        | 'off'
        | 'none'
        | 'on'
        | 'sentences'
        | 'words'
        | 'characters'
    'autocorrect'?: string
    'autocomplete'?: string
    'autofocus'?: boolean
    'spellcheck'?: boolean
    'inputmode'?:
        | 'none'
        | 'text'
        | 'decimal'
        | 'numeric'
        | 'tel'
        | 'search'
        | 'email'
        | 'url'
    'valueAsDate'?: Date
    'valueAsNumber'?: number
    'sl-change'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-clear'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-input'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-focus'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-blur'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
}

interface SlMenuItemProps {
    checked?: boolean
    disabled?: boolean
    value?: string
    onClick?: JSXInternal.MouseEventHandler<HTMLButtonElement>
}
interface SlMenuLabelProps {}

interface SlOptionProps {
    value: string
    disabled?: boolean
}

interface SlPopupProps {
    active?: boolean
    anchor?: Element | string | VirtualElement
    arrow?: boolean
    arrowPadding?: number
    arrowPlacement?: 'start' | 'end' | 'center' | 'anchor'
    disabled?: boolean
    distance?: number
    flip?: boolean
    flipBoundary?: Element | Element[]
    flipFallbackPlacements?: string
    flipFallbackStrategy?: 'best-fit' | 'initial'
    flipPadding?: number
    hoist?: boolean
    open?: boolean
    placement?:
        | 'top'
        | 'top-start'
        | 'top-end'
        | 'bottom'
        | 'bottom-start'
        | 'bottom-end'
        | 'right'
        | 'right-start'
        | 'right-end'
        | 'left'
        | 'left-start'
        | 'left-end'
    popup?: HTMLElement
    shift?: boolean
    skidding?: number
    strategy?: 'absolute' | 'fixed'
}

interface SlRadioGroupProps {
    name?: string
    label?: string
    required?: boolean
    value?: string
    onInput?: () => void
    ref?: Ref<SlRadioGroup>
}
interface SlRadioButtonProps {
    value?: string
    pill?: boolean
    size?: Size
}

interface SlSelectProps
    extends JSXInternal.DOMAttributes<HTMLSelectElement>,
        Omit<JSXInternal.HTMLAttributes<HTMLSelectElement>, 'size'> {
    'clearable'?: boolean
    'disabled'?: boolean
    'filled'?: boolean
    'helpText'?: string
    'hoist'?: boolean
    'invalid'?: boolean
    'label'?: string
    'maxTagsVisible'?: number
    'multiple'?: boolean
    'name'?: string
    'pill'?: boolean
    'placeholder'?: string
    'required'?: boolean
    'size'?: Size
    'handleClearClick'?: (
        e: JSXInternal.TargetedEvent<HTMLSelectElement>,
    ) => void
    'sl-blur'?: (e: JSXInternal.TargetedEvent<HTMLSelectElement>) => void
    'sl-change'?: (e: JSXInternal.TargetedEvent<HTMLSelectElement>) => void
    'sl-clear'?: (e: JSXInternal.TargetedEvent<HTMLSelectElement>) => void
    'sl-focus'?: (e: JSXInternal.TargetedEvent<HTMLSelectElement>) => void
    'sl-input'?: (e: JSXInternal.TargetedEvent<HTMLSelectElement>) => void
    'value'?: string | Array<string>
    'children'?: ReactNode
}

interface SlSkeletonProps {
    ref?: Ref<SlSkeleton | undefined>
    effect?: SkeletonEffect
    label?: string
}

interface SlSpinnerProps {}

interface SlSwitchProps {
    name?: string
    value?: string
    disabled?: boolean
    required?: boolean
    checked?: boolean
    invalid?: boolean
    handleClick?: () => void
}

interface SlTabProps {
    active?: boolean
    closable?: boolean
    disabled?: boolean
    panel?: string
}

interface SlTabGroupProps {
    activation?: 'auto' | 'manual'
    noScrollControls?: boolean
    placement?: Placement
}

interface SlTabPanelProps {
    active?: boolean
    name?: string
}
interface SlTextareaProps
    extends JSXInternal.DOMAttributes<HTMLTextAreaElement>,
        Omit<JSXInternal.HTMLAttributes<HTMLTextAreaElement>, 'size'> {
    'size'?: 'small' | 'medium' | 'large'
    'name'?: string
    'value'?: string
    'filled'?: boolean
    'label'?: string
    'helpText'?: string
    'placeholder'?: string
    'rows'?: number
    'resize'?: 'none' | 'vertical' | 'auto'
    'disabled'?: boolean
    'readonly'?: boolean
    'minlength'?: number
    'maxlength'?: number
    'pattern'?: string
    'required'?: boolean
    'invalid'?: boolean
    'autocapitalize'?:
        | 'off'
        | 'none'
        | 'on'
        | 'sentences'
        | 'words'
        | 'characters'
    'autocorrect'?: string
    'autocomplete'?: string
    'autofocus'?: boolean
    'spellcheck'?: boolean
    'inputmode'?:
        | 'none'
        | 'text'
        | 'decimal'
        | 'numeric'
        | 'tel'
        | 'search'
        | 'email'
        | 'url'
    'sl-change'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-clear'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-input'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-focus'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
    'sl-blur'?: (e: JSXInternal.TargetedEvent<HTMLInputElement>) => void
}

interface SlTooltipProps {
    positioner?: HTMLElement
    tooltip?: HTMLElement
    content?: string
    placement?:
        | 'top'
        | 'top-start'
        | 'top-end'
        | 'right'
        | 'right-start'
        | 'right-end'
        | 'bottom'
        | 'bottom-start'
        | 'bottom-end'
        | 'left'
        | 'left-start'
        | 'left-end'
    disabled?: boolean
    distance?: number
    open?: boolean
    skidding?: number
    trigger?: string
    hoist?: boolean
    ref?: Ref<SlTooltip | undefined>
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'sl-alert': SlAlertProps & WebComponentAttributes
            'sl-avatar': SlAvatarProps & WebComponentAttributes
            'sl-badge': SlBadgeProps & WebComponentAttributes
            'sl-button': SlButtonProps & WebComponentAttributes
            'sl-button-group': SlButtonGroupProps & WebComponentAttributes
            'sl-card': SlCardProps & WebComponentAttributes
            'sl-checkbox': SlCheckboxProps & WebComponentAttributes
            'sl-dialog': SlDialogProps & WebComponentAttributes
            'sl-drawer': SlDrawerProps & WebComponentAttributes
            'sl-dropdown': SlDropDownProps & WebComponentAttributes
            'sl-icon': SlIconProps & WebComponentAttributes
            'sl-icon-button': SlIconButtonProps & WebComponentAttributes
            'sl-input': SlInputProps & WebComponentAttributes
            'sl-menu': WebComponentAttributes
            'sl-menu-item': SlMenuItemProps & WebComponentAttributes
            'sl-menu-label': SlMenuLabelProps & WebComponentAttributes
            'sl-option': SlOptionProps & WebComponentAttributes
            'sl-popup': SlPopupProps & WebComponentAttributes
            'sl-radio-group': SlRadioGroupProps & WebComponentAttributes
            'sl-radio-button': SlRadioButtonProps & WebComponentAttributes
            'sl-select': SlSelectProps & WebComponentAttributes
            'sl-skeleton': SlSkeletonProps & WebComponentAttributes
            'sl-spinner': SlSpinnerProps & WebComponentAttributes
            'sl-switch': SlSwitchProps & WebComponentAttributes
            'sl-tab': SlTabProps & WebComponentAttributes
            'sl-tab-group': SlTabGroupProps & WebComponentAttributes
            'sl-tab-panel': SlTabPanelProps & WebComponentAttributes
            'sl-textarea': SlTextareaProps & WebComponentAttributes
            'sl-tooltip': SlTooltipProps & WebComponentAttributes
        }
    }
}
