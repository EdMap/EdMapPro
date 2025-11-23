import { ComponentChildren, createContext } from 'react'
import { MutableRef, useRef } from 'react'

export const rootContainer = document.querySelector('html') as HTMLElement
export const appContainer = document.getElementById('app') as HTMLDivElement

export interface AppContext {
    containerElRef: MutableRef<HTMLElement>
}
export const AppContext = createContext<AppContext>({} as AppContext)

export type AppContextProviderProps = {
    children: ComponentChildren
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
