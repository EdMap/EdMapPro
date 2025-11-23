import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './features/app'
import './ui/styles/index.css'

import { appContainer } from './features/app/context'
import './ui/index'

if (appContainer) {
    const root = createRoot(appContainer)
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}
