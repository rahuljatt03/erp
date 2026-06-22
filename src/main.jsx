import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PrimeReactProvider } from 'primereact/api'
import { store } from './store/store'
import { logout } from './modules/auth/authSlice'

// When the axios layer detects an expired/invalid token (a 401 on an
// authenticated request), it emits this event — drop the session so <RequireAuth>
// redirects to /login. Lives here (outside React) since the interceptor can't use
// router navigation directly.
window.addEventListener('erp:auth-expired', () => store.dispatch(logout()))

// PrimeReact styles first, so the hand-written design system in index.css keeps
// the last word on any rare class overlap. PrimeReact namespaces under `.p-*`.
import 'primereact/resources/themes/lara-light-indigo/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './index.css'

import App from './App.jsx'
import { FeedbackProvider } from './shared/feedback/FeedbackProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PrimeReactProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </PrimeReactProvider>
    </Provider>
  </StrictMode>,
)
