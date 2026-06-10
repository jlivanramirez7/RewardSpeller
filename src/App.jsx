import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';
import LoginPage from './pages/LoginPage';
import RequestAccessPage from './pages/RequestAccessPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Leaderboard from './components/Leaderboard';
import { useAuth } from './context/AuthContext';
import { useAppContext } from './context/AppContext';
import { Settings, Gamepad2, LogOut, Trophy } from 'lucide-react';

function App() {
  const location = useLocation();
  const { user, signOut, isAdmin, isStudent } = useAuth();
  const { activeChildId, currentGradeLevel } = useAppContext();

  return (
    <div className="app-container">
      <nav className="glass-nav">
        <div className="nav-brand">
          <span className="logo-text">RewardSpeller</span>
        </div>
        <div className="nav-links">
          {user && (
            <>
              <Link to="/app" className={`nav-link ${location.pathname === '/app' ? 'active' : ''}`}>
                <Gamepad2 size={20} />
                Student Portal
              </Link>
              <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
                <Trophy size={20} />
                Leaderboard
              </Link>
              {!isStudent && (
                <Link to="/parent" className={`nav-link ${location.pathname === '/parent' ? 'active' : ''}`}>
                  <Settings size={20} />
                  Parent Portal
                </Link>
              )}
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
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <StudentPortal key={activeChildId} />
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard currentGradeLevel={currentGradeLevel} />
            </ProtectedRoute>
          } />
          <Route path="/parent/*" element={
            <ProtectedRoute requireParent={true}>
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
