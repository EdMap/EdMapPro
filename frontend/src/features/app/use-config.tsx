import { createContext, FC, ReactNode, useContext } from 'react'
import { AppConfig, config as appConfig } from './config'

export type AppConfigContext = AppConfig
const AppConfigContext: React.Context<AppConfigContext> =
    createContext(appConfig)

export const AppConfigProvider: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <AppConfigContext.Provider value={appConfig}>
            {children}
        </AppConfigContext.Provider>
    )
}

export const useAppConfig = (): AppConfigContext => useContext(AppConfigContext)
