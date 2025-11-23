import { createRoot } from 'react-dom/client'
import App from './features/app'
import './ui/styles/index.css'

import { appContainer } from './features/app/context'
import './ui/index'

if (appContainer) {
    createRoot(appContainer).render(<App />)
}
