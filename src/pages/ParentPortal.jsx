import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ParentPortal = () => {
  const { struggleWords, currentGradeLevel, setCurrentGradeLevel, rewards, setRewards, studentPoints, tiers, resetProgress, enablePacing, setEnablePacing, enableDifficultyGating, setEnableDifficultyGating } = useAppContext();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

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
              <option value="4th" style={{color: 'black'}}>4th Grade (Building Blocks)</option>
              <option value="5th" style={{color: 'black'}}>5th Grade (Advanced Word Study)</option>
              <option value="6th" style={{color: 'black'}}>6th Grade (Advanced Roots)</option>
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
            style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
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

        {/* Experience Pacing Configuration */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Experience Control</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Control curriculum accessibility. Active pacing forces linear unlocking through milestones.
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1.25rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px',
            border: '1px solid var(--surface-border)'
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Adaptive Pacing</h3>
              <p style={{ fontSize: '0.75rem', color: enablePacing ? 'var(--success-color)' : '#94a3b8' }}>
                {enablePacing ? '✅ ACTIVE (Max 3 ahead)' : '🔓 OFF (Unlocked Access)'}
              </p>
            </div>
            
            {/* Theming-matched Toggle Switch */}
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: '52px', 
              height: '28px',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={enablePacing}
                onChange={(e) => setEnablePacing(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: enablePacing ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)',
                transition: '0.3s ease', 
                borderRadius: '34px',
                boxShadow: enablePacing ? '0 0 10px rgba(244, 63, 94, 0.4)' : 'none',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{
                  position: 'absolute', 
                  content: '""', 
                  height: '20px', 
                  width: '20px', 
                  left: '4px', 
                  bottom: '3px',
                  backgroundColor: 'white', 
                  transition: '0.3s cubic-bezier(0.2, 1.2, 0.5, 1.2)', 
                  borderRadius: '50%',
                  transform: enablePacing ? 'translateX(24px)' : 'translateX(0)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        {/* Difficulty Progression Configuration */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Difficulty Progression</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Enforce linear mastery sequence. Students must perfectly master the previous tier to attempt higher complexity modes.
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1.25rem', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px',
            border: '1px solid var(--surface-border)'
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Sequential Lock</h3>
              <p style={{ fontSize: '0.75rem', color: enableDifficultyGating ? 'var(--success-color)' : '#94a3b8' }}>
                {enableDifficultyGating ? '✅ ACTIVE (E → M → H)' : '🔓 OFF (Full Access)'}
              </p>
            </div>
            
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: '52px', 
              height: '28px',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={enableDifficultyGating}
                onChange={(e) => setEnableDifficultyGating(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: enableDifficultyGating ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)',
                transition: '0.3s ease', 
                borderRadius: '34px',
                boxShadow: enableDifficultyGating ? '0 0 10px rgba(244, 63, 94, 0.4)' : 'none',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{
                  position: 'absolute', 
                  content: '""', 
                  height: '20px', 
                  width: '20px', 
                  left: '4px', 
                  bottom: '3px',
                  backgroundColor: 'white', 
                  transition: '0.3s cubic-bezier(0.2, 1.2, 0.5, 1.2)', 
                  borderRadius: '50%',
                  transform: enableDifficultyGating ? 'translateX(24px)' : 'translateX(0)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}></span>
              </span>
            </label>
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
          onClick={() => setShowResetModal(true)}
        >
          Reset All Progress
        </button>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" role="dialog" aria-modal="true" style={{
            padding: '2.5rem', maxWidth: '450px', width: '90%', textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.2)',
            borderTop: '4px solid var(--accent-color)'
          }}>
            <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Confirm Reset</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Are you absolutely sure you want to reset all progress? This cannot be undone!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--error-color)', color: 'white', border: 'none' }}
                onClick={() => {
                  resetProgress();
                  setShowResetModal(false);
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ParentPortal;
