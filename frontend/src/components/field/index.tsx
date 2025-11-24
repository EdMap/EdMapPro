import { FC, InputHTMLAttributes, ReactNode } from 'react'
import styles from './index.module.css'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    children?: ReactNode
    label?: string
}

const InputField: FC<InputFieldProps> = ({
    children,
    label,
    className,
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const inputCls = `${styles.field} ${className || ''}`

    return (
        <div className={styles.wrapper}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}
            <input
                id={inputId}
                {...props}
                className={inputCls}
            />
            {children}
        </div>
    )
}

export default InputField
