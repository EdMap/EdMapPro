import { createContext, FC, PreactContext } from 'react'
import { useContext } from 'react'
import { AppConfig, config as appConfig } from './config'

export type AppConfigContext = AppConfig
const AppConfigContext: PreactContext<AppConfigContext> =
    createContext(appConfig)

export const AppConfigProvider: FC = ({ children }) => {
    return (
        <AppConfigContext.Provider value={appConfig}>
            {children}
        </AppConfigContext.Provider>
    )
}

export const useAppConfig = (): AppConfigContext => useContext(AppConfigContext)
