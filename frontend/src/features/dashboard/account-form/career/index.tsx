import { SlRadioGroup } from '@shoelace-style/shoelace'
import { FC } from 'react'
import { useEffect, useRef } from 'react'
import { CareerEnum, UserProfileUpdateDto } from '../../../../__generated__/api'
import { CareerEnumString, toCareerChoice } from '../../../../utils/models'
import { FORM_NAMES } from '../models'

const Career: FC<{
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
        <stack-l space="var(--s-2)">
            <sl-radio-group
                ref={radioRef}
                name={FORM_NAMES.CAREER}
                label="Select career"
                required
                value={formData?.career}
            >
                <cluster-l space="var(--s0)">
                    {Object.keys(CareerEnum)?.map((key) => (
                        <sl-radio-button
                            key={key}
                            value={CareerEnum[key as CareerEnumString]}
                        >
                            {
                                toCareerChoice[
                                    CareerEnum[key as CareerEnumString]
                                ]
                            }
                        </sl-radio-button>
                    ))}
                </cluster-l>
            </sl-radio-group>
        </stack-l>
    )
}

export default Career
