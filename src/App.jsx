import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import ParentPortal from './pages/ParentPortal';
import { Settings, Gamepad2 } from 'lucide-react';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="glass-nav">
        <div className="nav-brand">
          <span className="logo-text">SummerSpelling</span>
        </div>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Gamepad2 size={20} />
            Student Portal
          </Link>
          <Link to="/parent" className={`nav-link ${location.pathname === '/parent' ? 'active' : ''}`}>
            <Settings size={20} />
            Parent Portal
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<StudentPortal />} />
          <Route path="/parent/*" element={<ParentPortal />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
