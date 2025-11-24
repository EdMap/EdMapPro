import { FC } from 'react'
import { GenderEnum, UserProfileUpdateDto } from '../../../../__generated__/api'
import { FORM_NAMES } from '../models'
import styles from './index.module.css'

export type GenderEnumString = keyof typeof GenderEnum

const Gender: FC<{
    formData?: UserProfileUpdateDto | null
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ formData, handleChange }) => {
    return (
        <div className={styles.wrapper}>
            <label className={styles.label}>Select your gender</label>
            <div className={styles.radioGroup}>
                {Object.keys(GenderEnum)?.map((key) => (
                    <label key={key} className={styles.radioItem}>
                        <input
                            type="radio"
                            name={FORM_NAMES.GENDER}
                            value={GenderEnum[key as GenderEnumString]}
                            checked={formData?.gender === GenderEnum[key as GenderEnumString]}
                            onChange={handleChange}
                            required
                        />
                        <span>{GenderEnum[key as GenderEnumString]}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

export default Gender
