import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Shoelace components and setup FIRST
import './ui/index'

// Then import global styles
import './ui/styles/index.css'

import App from './features/app'
import { appContainer } from './features/app/context'

if (appContainer) {
    const root = createRoot(appContainer)
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}
