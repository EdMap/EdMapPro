import { CareerEnum, SeniorityLevelEnum } from '../__generated__/api'

export const toSeniorityChoice = {
    [SeniorityLevelEnum.Int]: 'Intern',
    [SeniorityLevelEnum.Jun]: 'Junior',
    [SeniorityLevelEnum.Mid]: 'Middle',
    [SeniorityLevelEnum.Snr]: 'Senior',
}

export type SeniorityLevelEnumString = keyof typeof SeniorityLevelEnum

export const toCareerChoice = {
    [CareerEnum.Dev]: 'Software Engineer',
    [CareerEnum.Dsgnr]: 'Designer',
    [CareerEnum.Pm]: 'Project Manager',
    [CareerEnum.Po]: 'Product Owner',
    [CareerEnum.Mk]: 'Marketer',
    [CareerEnum.Ds]: 'Data Scientist',
    [CareerEnum.Cw]: 'Content Writer',
}

export type CareerEnumString = keyof typeof CareerEnum
