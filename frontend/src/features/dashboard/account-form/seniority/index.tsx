import { SlRadioGroup } from '@shoelace-style/shoelace'
import { FunctionComponent } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import {
    SeniorityLevelEnum,
    UserProfileUpdateDto,
} from '../../../../__generated__/api'
import {
    SeniorityLevelEnumString,
    toSeniorityChoice,
} from '../../../../utils/models'
import { FORM_NAMES } from '../models'

const Seniority: FunctionComponent<{
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
                name={FORM_NAMES.SENIORITY}
                label="Select your seniority"
                required
                value={formData?.seniority_level}
            >
                <cluster-l space="var(--s0)">
                    {Object.keys(SeniorityLevelEnum)?.map((key) => (
                        <sl-radio-button
                            key={key}
                            value={
                                SeniorityLevelEnum[
                                    key as SeniorityLevelEnumString
                                ]
                            }
                        >
                            {
                                toSeniorityChoice[
                                    SeniorityLevelEnum[
                                        key as SeniorityLevelEnumString
                                    ]
                                ]
                            }
                        </sl-radio-button>
                    ))}
                </cluster-l>
            </sl-radio-group>
        </stack-l>
    )
}

export default Seniority
