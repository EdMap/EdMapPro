import { FC } from 'react'
import {
    SeniorityLevelEnum,
    UserProfileUpdateDto,
} from '../../../../__generated__/api'
import {
    SeniorityLevelEnumString,
    toSeniorityChoice,
} from '../../../../utils/models'
import { FORM_NAMES } from '../models'
import styles from '../gender/index.module.css'

const Seniority: FC<{
    formData?: UserProfileUpdateDto | null
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ formData, handleChange }) => {
    return (
        <div className={styles.wrapper}>
            <label className={styles.label}>Select your seniority</label>
            <div className={styles.radioGroup}>
                {Object.keys(SeniorityLevelEnum)?.map((key) => (
                    <label key={key} className={styles.radioItem}>
                        <input
                            type="radio"
                            name={FORM_NAMES.SENIORITY}
                            value={SeniorityLevelEnum[key as SeniorityLevelEnumString]}
                            checked={formData?.seniority_level === SeniorityLevelEnum[key as SeniorityLevelEnumString]}
                            onChange={handleChange}
                            required
                        />
                        <span>{toSeniorityChoice[SeniorityLevelEnum[key as SeniorityLevelEnumString]]}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

export default Seniority
