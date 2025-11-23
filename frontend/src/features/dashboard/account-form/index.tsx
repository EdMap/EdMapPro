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

    const handleChange = useCallback((e: CustomEvent) => {
        const target = e.target as HTMLInputElement

        setFormData((prevState) => {
            return {
                ...prevState,
                [target.name]: target.value,
            } as UserProfileUpdateDto
        })
    }, [])

    const handleSubmit = useCallback(
        (e: SubmitEvent) => {
            e.preventDefault()

            const target = e.target as HTMLFormElement

            if (target.checkValidity()) {
                dispatch(updateProfile(formData as UserProfileUpdateDto))
            }
        },
        [formData, dispatch],
    )

    return (
        <sl-dialog open label="Setup your profile" className={styles.dialog}>
            <form ref={formRef} onSubmit={handleSubmit}>
                <stack-l space="var(--s1)">
                    <cluster-l space="var(--s-1)">
                        <InputField
                            required
                            label="First Name"
                            name={FORM_NAMES.FIRST_NAME}
                            placeholder="Enter your first name"
                            onInput={handleChange}
                            value={formData?.first_name}
                        />
                        <InputField
                            required
                            label="Last Name"
                            name={FORM_NAMES.LAST_NAME}
                            placeholder="Enter your last name"
                            onInput={handleChange}
                            value={formData?.last_name}
                        />
                    </cluster-l>
                    <Gender formData={formData} handleChange={handleChange} />
                    <Career formData={formData} handleChange={handleChange} />
                    <Seniority
                        formData={formData}
                        handleChange={handleChange}
                    />
                </stack-l>

                <cluster-l
                    justify={error ? 'space-between' : 'flex-end'}
                    slot="footer"
                >
                    {error && <HelpText variant="danger" text={error} />}

                    <sl-button variant="primary" type="submit">
                        Update
                    </sl-button>
                </cluster-l>
            </form>
        </sl-dialog>
    )
}

export default AccountForm
