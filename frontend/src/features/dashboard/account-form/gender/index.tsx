import { SlRadioGroup } from '@shoelace-style/shoelace'
import { FC } from 'react'
import { useEffect, useRef } from 'react'
import { GenderEnum, UserProfileUpdateDto } from '../../../../__generated__/api'
import { FORM_NAMES } from '../models'
import styles from './index.module.css'

export type GenderEnumString = keyof typeof GenderEnum

const Gender: FC<{
    formData?: UserProfileUpdateDto | null
    handleChange: (e: CustomEvent) => void
}> = ({ formData, handleChange }) => {
    const radioRef = useRef<SlRadioGroup | null>(null)

    useEffect(() => {
        radioRef.current?.addEventListener('sl-change', (e) => {
            handleChange(e)
        })
    }, [handleChange])

    return (
        <stack-l space="var(--s-2)" class={styles.wrapper}>
            <sl-radio-group
                ref={radioRef}
                name={FORM_NAMES.GENDER}
                label="Select yout gender"
                required
                value={formData?.gender}
            >
                <cluster-l space="var(--s0)">
                    {Object.keys(GenderEnum)?.map((key) => (
                        <sl-radio-button
                            key={key}
                            value={GenderEnum[key as GenderEnumString]}
                        >
                            {GenderEnum[key as GenderEnumString]}
                        </sl-radio-button>
                    ))}
                </cluster-l>
            </sl-radio-group>
        </stack-l>
    )
}

export default Gender
