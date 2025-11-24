import { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { UserProfileUpdateDto } from '../../../__generated__/api'
import InputField from '../../../components/field'
import HelpText from '../../../components/help-text'
import { RootDispatch } from '../../app/_store'
import { updateProfile } from '../../auth/_store/effects'
import useAuth from '../../auth/use-auth'
import Career from './career'
import Gender from './gender'
import styles from './index.module.css'
import { FORM_NAMES } from './models'
import Seniority from './seniority'

const AccountForm = () => {
    const { error } = useAuth()

    const dispatch = useDispatch<RootDispatch>()
    const formRef = useRef<HTMLFormElement | null>(null)

    const [formData, setFormData] = useState<UserProfileUpdateDto | null>()

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement

        setFormData((prevState) => {
            return {
                ...prevState,
                [target.name]: target.value,
            } as UserProfileUpdateDto
        })
    }, [])

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            const target = e.target as HTMLFormElement

            if (target.checkValidity()) {
                dispatch(updateProfile(formData as UserProfileUpdateDto))
            }
        },
        [formData, dispatch],
    )

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Setup your profile</h2>
                </div>
                
                <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formContent}>
                        <div className={styles.formRow}>
                            <InputField
                                required
                                label="First Name"
                                name={FORM_NAMES.FIRST_NAME}
                                placeholder="Enter your first name"
                                onChange={handleChange}
                                value={formData?.first_name || ''}
                            />
                            <InputField
                                required
                                label="Last Name"
                                name={FORM_NAMES.LAST_NAME}
                                placeholder="Enter your last name"
                                onChange={handleChange}
                                value={formData?.last_name || ''}
                            />
                        </div>
                        <Gender formData={formData} handleChange={handleChange} />
                        <Career formData={formData} handleChange={handleChange} />
                        <Seniority
                            formData={formData}
                            handleChange={handleChange}
                        />
                    </div>

                    <div className={styles.modalFooter}>
                        {error && <HelpText variant="danger" text={error} />}
                        <button type="submit" className={styles.submitBtn}>
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AccountForm
