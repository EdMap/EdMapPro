import { createContext, FunctionComponent, PreactContext } from 'preact'
import { useContext } from 'preact/hooks'
import { AppConfig, config as appConfig } from './config'

export type AppConfigContext = AppConfig
const AppConfigContext: PreactContext<AppConfigContext> =
    createContext(appConfig)

export const AppConfigProvider: FunctionComponent = ({ children }) => {
    return (
        <AppConfigContext.Provider value={appConfig}>
            {children}
        </AppConfigContext.Provider>
    )
}

export const useAppConfig = (): AppConfigContext => useContext(AppConfigContext)
