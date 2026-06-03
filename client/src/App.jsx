import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import QrStudio from './pages/QrStudio'
import PublicStats from './pages/PublicStats'
import Unlock from './pages/Unlock'
import Settings from './pages/Settings'

function Protected({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage signup={false} />} />
      <Route path="/signup" element={<AuthPage signup />} />
      <Route path="/unlock/:shortCode" element={<Unlock />} />
      <Route path="/stats/:shortCode" element={<PublicStats />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/analytics/:id" element={<Protected><Analytics /></Protected>} />
      <Route path="/qr" element={<Protected><QrStudio /></Protected>} />
      <Route path="/qr/:id" element={<Protected><QrStudio /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
