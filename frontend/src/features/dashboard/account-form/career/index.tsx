import { FC } from 'react'
import { CareerEnum, UserProfileUpdateDto } from '../../../../__generated__/api'
import { CareerEnumString, toCareerChoice } from '../../../../utils/models'
import { FORM_NAMES } from '../models'
import styles from '../gender/index.module.css'

const Career: FC<{
    formData?: UserProfileUpdateDto | null
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ formData, handleChange }) => {
    return (
        <div className={styles.wrapper}>
            <label className={styles.label}>Select career</label>
            <div className={styles.radioGroup}>
                {Object.keys(CareerEnum)?.map((key) => (
                    <label key={key} className={styles.radioItem}>
                        <input
                            type="radio"
                            name={FORM_NAMES.CAREER}
                            value={CareerEnum[key as CareerEnumString]}
                            checked={formData?.career === CareerEnum[key as CareerEnumString]}
                            onChange={handleChange}
                            required
                        />
                        <span>{toCareerChoice[CareerEnum[key as CareerEnumString]]}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

export default Career
