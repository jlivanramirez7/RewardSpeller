import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ParentPortal = () => {
  const { struggleWords, currentGradeLevel, setCurrentGradeLevel, rewards, setRewards, studentPoints, tiers, resetProgress } = useAppContext();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'password') {
      setIsAuthenticated(true);
    } else {
      setErrorMsg('Incorrect password');
      setPasswordInput('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="parent-portal animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Parent Portal Login</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please enter the password to access the command center.</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                marginBottom: '1rem'
              }}
              autoFocus
            />
            {errorMsg && <p style={{ color: 'var(--error-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>{errorMsg}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-portal animate-fade-in">
      <header className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-color)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Parent Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Command Center: Monitor progress and adjust curriculum.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Curriculum Calibration */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Curriculum Calibration</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Grade Level</label>
            <select 
              value={currentGradeLevel}
              onChange={(e) => setCurrentGradeLevel(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white',
                border: '1px solid var(--surface-border)',
                outline: 'none'
              }}
            >
              <option value="3rd" style={{color: 'black'}}>3rd Grade (Phonetic Focus)</option>
              <option value="4th-5th" style={{color: 'black'}}>4th-5th Grade (Building Blocks)</option>
              <option value="6th+" style={{color: 'black'}}>6th+ Grade (Advanced Roots)</option>
            </select>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Adjusting this will shift the underlying word banks available in the Student Portal.</p>
        </div>

        {/* Struggle Report & Stats */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Diagnostic Insights & Stats</h2>
          
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Words in Curriculum</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{tiers.reduce((acc, tier) => acc + tier.sections.reduce((sAcc, sec) => sAcc + sec.words.length, 0), 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Maximum Possible Points</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{tiers.reduce((acc, tier) => acc + tier.sections.reduce((sAcc, sec) => sAcc + sec.words.length, 0), 0) * 60}</div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Struggle Report</h3>
          {struggleWords.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ color: 'var(--success-color)' }}>No struggle areas identified yet! Student is performing well.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {struggleWords.map((item, index) => (
                <li key={index} style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{item.word}</span>
                  <span style={{ color: 'var(--error-color)' }}>Missed {item.count}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reward Configuration */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Reward System Configuration</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Define custom rewards to incentivize learning.</p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.rewardName.value;
              const cost = parseInt(e.target.rewardCost.value, 10);
              if (name && cost) {
                setRewards(prev => [...prev, { id: Date.now(), name, cost }]);
                e.target.reset();
              }
            }}
            style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}
          >
            <input 
              name="rewardName" 
              type="text" 
              placeholder="Reward Name (e.g. Park Trip)" 
              required
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              name="rewardCost" 
              type="number" 
              placeholder="Cost (pts)" 
              min="10"
              required
              style={{ width: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Rewards</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rewards.map(reward => {
                const progress = Math.min((studentPoints / reward.cost) * 100, 100);
                const canAfford = studentPoints >= reward.cost;
                return (
                  <li key={reward.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{reward.name}</span>
                      <button 
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setRewards(prev => prev.filter(r => r.id !== reward.id))}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{Math.min(studentPoints, reward.cost)} / {reward.cost} pts</span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: canAfford ? 'var(--success-color)' : 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', borderLeft: '4px solid var(--error-color)' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          This will wipe all student points, streak data, struggle words, section high scores, and reset tier unlocking. It cannot be undone.
        </p>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--error-color)', color: 'white', border: 'none' }}
          onClick={() => {
            if (window.confirm("Are you absolutely sure you want to reset all progress? This cannot be undone!")) {
              resetProgress();
              alert("Progress has been reset.");
            }
          }}
        >
          Reset All Progress
        </button>
      </div>

    </div>
  );
};

export default ParentPortal;
