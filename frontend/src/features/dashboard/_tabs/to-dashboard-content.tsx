import { VNode } from 'react'
import InterviewSessions from '../../interview-sessions'
import NegotiationSessions from '../../negotiation-sessions'
import { DashboardTabs } from '../models'
import SimulationMap from '../simulation-map'

export const DashboardTabsContentDefault = {
    content: <SimulationMap />,
}

export const DashboardTabsContent: {
    [key in DashboardTabs]: {
        content: VNode
        disabled?: boolean
    }
} = {
    [DashboardTabs.SIMULATIONS_MAP]: {
        content: <SimulationMap />,
    },
    [DashboardTabs.INTERVIEW_SESSIONS]: {
        content: <InterviewSessions />,
    },
    [DashboardTabs.NEGOTIATION_SESSIONS]: {
        content: <NegotiationSessions />,
    },
    [DashboardTabs.WORKPLACE_SIMULATION]: {
        content: <div>No content</div>,
        disabled: true,
    },
}
