import { render } from 'preact'
import App from './features/app'
import './ui/styles/index.css'

import { appContainer } from './features/app/context'
import './ui/index'

if (appContainer) {
    render(<App />, appContainer)
}
