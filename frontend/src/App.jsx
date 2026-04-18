import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VaultPage from './pages/VaultPage';
import CreatePage from './pages/CreatePage';
import SharedPage from './pages/SharedPage';
import GhostWallPage from './pages/GhostWallPage';
import FriendsPage from './pages/FriendsPage';
import CapsuleViewPage from './pages/CapsuleViewPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="page">
      {children}
    </main>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'var(--font-sans)',
                background: '#fff',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-sand)',
              },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected */}
            <Route path="/vault" element={
              <ProtectedRoute>
                <AppLayout><VaultPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <AppLayout><CreatePage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/shared" element={
              <ProtectedRoute>
                <AppLayout><SharedPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ghost" element={
              <ProtectedRoute>
                <AppLayout><GhostWallPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/friends" element={
              <ProtectedRoute>
                <AppLayout><FriendsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/capsule/:id" element={
              <ProtectedRoute>
                <AppLayout><CapsuleViewPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout><ProfilePage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Default */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;