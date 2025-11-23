import { SlDialog } from '@shoelace-style/shoelace'
import { FunctionComponent } from 'preact'
import { MutableRef, useCallback, useRef, useState } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import { CareerEnum, SeniorityLevelEnum } from '../../../__generated__/api'
import {
    CareerEnumString,
    SeniorityLevelEnumString,
    toCareerChoice,
    toSeniorityChoice,
} from '../../../utils/models'
import { setConfiguration } from '../_store/reducer'
import { SimConfiguration } from '../_store/state'
import useInterviewSimulation from '../_store/use-interview-details'
import styles from './index.module.css'

const SimulationConfigurationDialog: FunctionComponent<{
    dialogRef: MutableRef<SlDialog | null>
}> = ({ dialogRef }) => {
    const formRef = useRef<HTMLFormElement | null>(null)
    const { configuration } = useInterviewSimulation()
    const dispatch = useDispatch()
    const [conf, setConf] = useState<SimConfiguration>(configuration ?? {})

    const handleCancel = useCallback(() => {
        dialogRef.current?.hide()
        formRef.current?.reset()
        dispatch(setConfiguration({}))
        setConf({})
    }, [dialogRef, dispatch])

    const handleApply = useCallback(() => {
        dispatch(setConfiguration(conf))
        dialogRef.current?.hide()
    }, [dispatch, conf, dialogRef])

    const handleChange = useCallback((event: CustomEvent) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement

        setConf((prevState) => {
            return {
                ...prevState,
                [`${target.name}`]: target.value,
            }
        })
    }, [])

    return (
        <sl-dialog
            ref={dialogRef}
            label="Configure simulation"
            class={styles.dialog}
        >
            <form ref={formRef}>
                <stack-l space="var(--s-1)" class={styles.body}>
                    <sl-input
                        label="Company name"
                        name="company"
                        placeholder="Enter company name"
                        value={conf?.company}
                        onInput={handleChange}
                        required
                    />
                    <sl-select
                        name="seniority_level"
                        onsl-change={handleChange}
                        label="Level"
                        placeholder="Enter level"
                        required
                        value={conf?.seniority_level}
                    >
                        <sl-menu>
                            {Object.keys(SeniorityLevelEnum).map((level) => {
                                return (
                                    <sl-option
                                        value={
                                            SeniorityLevelEnum[
                                                level as SeniorityLevelEnumString
                                            ]
                                        }
                                        key={level}
                                    >
                                        {
                                            toSeniorityChoice[
                                                SeniorityLevelEnum[
                                                    level as SeniorityLevelEnumString
                                                ]
                                            ]
                                        }
                                    </sl-option>
                                )
                            })}
                        </sl-menu>
                    </sl-select>

                    <sl-select
                        label="Position"
                        name="career"
                        placeholder="Enter position (e.g. Front-End Developer)"
                        value={conf?.career}
                        onsl-change={handleChange}
                        required
                    >
                        <sl-menu>
                            {Object.keys(CareerEnum).map((level) => {
                                return (
                                    <sl-option
                                        value={
                                            CareerEnum[
                                                level as CareerEnumString
                                            ]
                                        }
                                        key={level}
                                    >
                                        {
                                            toCareerChoice[
                                                CareerEnum[
                                                    level as CareerEnumString
                                                ]
                                            ]
                                        }
                                    </sl-option>
                                )
                            })}
                        </sl-menu>
                    </sl-select>

                    <sl-textarea
                        label="Job Posting"
                        name="job_description"
                        placeholder="Enter job posting"
                        required
                        resize="none"
                        onInput={handleChange}
                        rows={10}
                        value={conf?.job_description}
                    />
                </stack-l>
            </form>
            <cluster-l justify="flex-end" space="var(--s-2)" slot="footer">
                <sl-button variant="neutral" onClick={handleCancel}>
                    <sl-icon name="x-lg" slot="prefix"></sl-icon>
                    Cancel
                </sl-button>
                <sl-button variant="primary" onClick={handleApply}>
                    <sl-icon name="check-lg" slot="prefix"></sl-icon>
                    Apply
                </sl-button>
            </cluster-l>
        </sl-dialog>
    )
}

export default SimulationConfigurationDialog
