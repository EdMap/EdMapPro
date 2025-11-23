import { FC } from 'react'
import { SlInputProps } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

const InputField: FC<SlInputProps> = ({
    children,
    class: className,
    ...props
}) => {
    const inputCls = `${styles.field} ${className}`

    return (
        <sl-input {...props} className={inputCls}>
            {children}
        </sl-input>
    )
}

export default InputField
