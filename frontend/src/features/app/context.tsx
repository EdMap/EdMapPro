import { createContext, useRef, ReactNode } from 'react'

export const rootContainer = document.querySelector('html') as HTMLElement
export const appContainer = document.getElementById('app') as HTMLDivElement

export interface AppContext {
    containerElRef: React.React.MutableRefObjectObject<HTMLElement>
}
export const AppContext = createContext<AppContext>({} as AppContext)

export type AppContextProviderProps = {
    children: ReactNode
}

export const AppContextProvider = ({
    children,
    ...appContext
}: AppContextProviderProps) => {
    const containerElRef = useRef<HTMLElement>(rootContainer)

    return (
        <AppContext.Provider value={{ ...appContext, containerElRef }}>
            {children}
        </AppContext.Provider>
    )
}
