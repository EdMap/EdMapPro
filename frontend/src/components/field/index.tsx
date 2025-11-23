import { FunctionComponent } from 'preact'
import { SlInputProps } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

const InputField: FunctionComponent<SlInputProps> = ({
    children,
    class: className,
    ...props
}) => {
    const inputCls = `${styles.field} ${className}`

    return (
        <sl-input {...props} class={inputCls}>
            {children}
        </sl-input>
    )
}

export default InputField
