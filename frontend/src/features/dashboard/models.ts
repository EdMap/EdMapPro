export enum DashboardTabs {
    SIMULATIONS_MAP = 'simulations-map',
    INTERVIEW_SESSIONS = 'interview-sessions',
    NEGOTIATION_SESSIONS = 'negotiation-sessions',
    WORKPLACE_SIMULATION = 'workplace-simulation',
}

export enum SimulationMapItems {
    INTERVIEW_PRACTICE = 'interview-practice',
    OFFER_NEGOTIATION = 'offer-negotiation',
    WORKPLACE_SIMULATION = 'workplace-simulation',
}

export type DashboardTabsString = keyof typeof DashboardTabs
export type SimulationMapItemsString = keyof typeof SimulationMapItems

export const toDashboardTabsIcons = {
    [DashboardTabs.SIMULATIONS_MAP]: 'map',
    [DashboardTabs.INTERVIEW_SESSIONS]: 'robot',
    [DashboardTabs.NEGOTIATION_SESSIONS]: 'file-earmark-text',
    [SimulationMapItems.INTERVIEW_PRACTICE]: 'robot',
    [SimulationMapItems.OFFER_NEGOTIATION]: 'file-earmark-text',
    [DashboardTabs.WORKPLACE_SIMULATION]: 'briefcase',
}

export const SIMULATION_ICONS = {
    INTERVIEW_PRACTICE:
        toDashboardTabsIcons[SimulationMapItems.INTERVIEW_PRACTICE],
    OFFER_NEGOTIATION:
        toDashboardTabsIcons[SimulationMapItems.OFFER_NEGOTIATION],
    WORKPLACE_SIMULATION:
        toDashboardTabsIcons[SimulationMapItems.WORKPLACE_SIMULATION],
}
