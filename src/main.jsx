import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NeedsProvider } from './context/NeedsContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { VolunteersProvider } from './context/VolunteersContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NeedsProvider>
        <VolunteersProvider>
          <App />
        </VolunteersProvider>
      </NeedsProvider>
    </AuthProvider>
  </StrictMode>,
)
