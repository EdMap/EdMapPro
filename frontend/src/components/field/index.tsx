import { FC, ReactNode } from 'react'
import { SlInputProps } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

interface InputFieldProps extends SlInputProps {
    children?: ReactNode
}

const InputField: FC<InputFieldProps> = ({
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
