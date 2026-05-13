import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';
import LoginPage from './pages/LoginPage';
import RequestAccessPage from './pages/RequestAccessPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { Settings, Gamepad2, LogOut } from 'lucide-react';

function App() {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="app-container">
      <nav className="glass-nav">
        <div className="nav-brand">
          <span className="logo-text">RewardSpeller</span>
        </div>
        <div className="nav-links">
          {user && (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                <Gamepad2 size={20} />
                Student Portal
              </Link>
              <Link to="/parent" className={`nav-link ${location.pathname === '/parent' ? 'active' : ''}`}>
                <Settings size={20} />
                Parent Portal
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                  Admin
                </Link>
              )}
              <button className="nav-link" onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={20} />
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <StudentPortal />
            </ProtectedRoute>
          } />
          <Route path="/parent/*" element={
            <ProtectedRoute>
              <ParentPortal />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
