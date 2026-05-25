import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';

/**
 * @component ParentPortal
 * @description Parental administration command center. Manages multi-student profiles,
 * grade-level curriculum calibration, diagnostic struggle ledgers, custom reward configuration,
 * adaptive pacing milestones, and secure profile progress resets.
 *
 * @returns {React.ReactElement} The parent portal control interface.
 */
const ParentPortal = () => {
  const { 
    struggleWords, currentGradeLevel, setCurrentGradeLevel, rewards, setRewards, studentPoints, tiers, resetProgress, enablePacing, setEnablePacing, enableDifficultyGating, setEnableDifficultyGating,
    isLoaded, error,
    studentName, setStudentName, linkStudentEmail,
    childrenMap, activeChildId, setActiveChildId, addChild, deleteChild, redeemReward
  } = useAppContext();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('4th');
  const [showAllStruggle, setShowAllStruggle] = useState(false);
  const [showCompletedRewards, setShowCompletedRewards] = useState(false);
  const [showAllIncompleteRewards, setShowAllIncompleteRewards] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [editCostInput, setEditCostInput] = useState(0);

  const sortedStruggles = useMemo(() => {
    return [...struggleWords].sort((a, b) => b.count - a.count);
  }, [struggleWords]);

  const visibleStruggles = useMemo(() => {
    return showAllStruggle ? sortedStruggles : sortedStruggles.slice(0, 5);
  }, [sortedStruggles, showAllStruggle]);

  const incompleteRewards = useMemo(() => {
    return rewards.filter(r => studentPoints < r.cost && !r.redeemed);
  }, [rewards, studentPoints]);

  const visibleIncompleteRewards = useMemo(() => {
    return showAllIncompleteRewards ? incompleteRewards : incompleteRewards.slice(0, 5);
  }, [incompleteRewards, showAllIncompleteRewards]);

  const readyToRedeemRewards = useMemo(() => {
    return rewards.filter(r => studentPoints >= r.cost && !r.redeemed);
  }, [rewards, studentPoints]);

  const redeemedRewards = useMemo(() => {
    return rewards.filter(r => r.redeemed === true);
  }, [rewards]);

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

  if (error) {
    return <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>Error loading configuration data: {error}</div>;
  }

  if (!isLoaded) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Configuration Data...</div>;
  }

  return (
    <div className="parent-portal animate-fade-in">
      <header className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-color)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Parent Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Command Center: Monitor progress and adjust curriculum.</p>
      </header>

      {/* Student Accounts Management */}

      {/* Student Accounts Management */}
      {/* Student Accounts Management: Renders grid of active and sibling child profiles, */}
      {/* enabling instant profile switching or permanent profile deletion with legacy fallback safeguards. */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>👥 Student Accounts Management</h2>
          {childrenMap && Object.keys(childrenMap).length < 3 ? (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              + Add New Student
            </button>
          ) : (
            <button className="btn-secondary" disabled={true} title="Maximum limit of 3 students reached">
              🔒 Max 3 Students Reached
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {childrenMap && Object.entries(childrenMap).map(([id, child]) => {
            const isActive = id === activeChildId;
            return (
              <div 
                key={id} 
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: isActive ? '2px solid #10b981' : '1px solid var(--surface-border)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>{child?.studentName || 'Student'}</h3>
                    {isActive && <span style={{ background: '#10b981', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Active</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Grade: {child?.currentGradeLevel || '4th'}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#fbbf24', fontWeight: 'bold' }}>
                  <span>Total Points:</span>
                  <span>{child?.studentPoints || 0} pts</span>
                </div>

                {/* Student Email Link */}
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Student Email Login (@gmail.com)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="email" 
                      placeholder="student@gmail.com"
                      defaultValue={child?.studentEmail || ''}
                      onBlur={(e) => {
                        const email = e.target.value.trim();
                        if (email !== (child?.studentEmail || '')) {
                          linkStudentEmail(id, email);
                        }
                      }}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Links this profile to student's Google account</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  {!isActive && (
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                      onClick={() => setActiveChildId(id)}
                    >
                      Switch To
                    </button>
                  )}
                  {Object.keys(childrenMap).length > 1 && (
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.5rem', fontSize: '0.85rem', borderColor: 'var(--error-color)', color: 'var(--error-color)', marginLeft: isActive ? 'auto' : '0' }}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete profile for ${child?.studentName || 'Student'}?`)) {
                          deleteChild(id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Student Profile */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Student Profile</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Student Name</label>
            <input 
              key={activeChildId}
              type="text" 
              defaultValue={studentName}
              onBlur={(e) => {
                const trimmed = e.target.value.trim();
                if (trimmed !== studentName) {
                  setStudentName(trimmed);
                }
              }}
              placeholder="Enter student name"
              maxLength={30}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white',
                border: '1px solid var(--surface-border)',
                outline: 'none'
              }}
            />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This name will be displayed in the Student Portal.</p>
        </div>

        {/* Curriculum Calibration */}
        {/* Curriculum Calibration: Select input proxying activeChild.currentGradeLevel. */}
        {/* Instantly remaps the underlying active word bank loaded in the Student Portal. */}
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
              <option value="2nd" style={{color: 'black'}}>2nd Grade (Basic Phonics & Sight Words)</option>
              <option value="3rd" style={{color: 'black'}}>3rd Grade (Phonetic Focus)</option>
              <option value="4th" style={{color: 'black'}}>4th Grade (Building Blocks)</option>
              <option value="5th" style={{color: 'black'}}>5th Grade (Advanced Word Study)</option>
              <option value="6th" style={{color: 'black'}}>6th Grade (Advanced Roots)</option>
            </select>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Adjusting this will shift the underlying word banks available in the Student Portal.</p>
        </div>

        {/* Struggle Report & Stats */}
        {/* Diagnostic Insights & Struggle Ledger: Aggregates total curriculum words/points */}
        {/* and displays a real-time ledger of specific terms missed during assessments. */}
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
          {sortedStruggles.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ color: 'var(--success-color)' }}>No struggle areas identified yet! Student is performing well.</p>
            </div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {visibleStruggles.map((item, index) => (
                  <li key={index} style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', textDecoration: item.mastered ? 'line-through' : 'none', color: item.mastered ? 'var(--text-secondary)' : 'white' }}>
                        {item.word}
                      </span>
                      {item.mastered && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                          🏆 Mastered
                        </span>
                      )}
                    </div>
                    <span style={{ color: item.mastered ? 'var(--text-secondary)' : 'var(--error-color)', fontSize: '0.9rem' }}>
                      {item.mastered 
                        ? `Resolved (Missed ${item.count}x, Correct ${item.correctCount || 1}x)` 
                        : `Missed ${item.count}x (Correct ${item.correctCount || 0}x)`}
                    </span>
                  </li>
                ))}
              </ul>
              {sortedStruggles.length > 5 && (
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowAllStruggle(!showAllStruggle)}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {showAllStruggle ? 'Show Less' : `Show More (${sortedStruggles.length - 5} more)`}
                </button>
              )}
            </>
          )}
        </div>

        {/* Reward Configuration */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Reward System Configuration</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Define custom rewards and manage parent-sponsored redemptions.</p>
          
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            
            {/* COLUMN 1: CATALOG & CREATION */}
            <div style={{ flex: '1 1 360px', minWidth: '320px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>🔧 Reward Catalog & Setup</h3>
              
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
                style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
              >
                <input 
                  name="rewardName" 
                  type="text" 
                  placeholder="Reward Name" 
                  required
                  style={{ flex: '2 1 180px', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }}
                />
                <input 
                  name="rewardCost" 
                  type="number" 
                  placeholder="Cost" 
                  min="10"
                  required
                  style={{ flex: '1 1 90px', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem', flexShrink: 0 }}>Add</button>
              </form>

              {incompleteRewards.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0', fontStyle: 'italic' }}>No active incomplete rewards configured.</p>
              ) : (
                <>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {visibleIncompleteRewards.map(reward => {
                      const progress = Math.min((studentPoints / reward.cost) * 100, 100);
                      return (
                        <li key={reward.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {editingRewardId === reward.id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input 
                                  type="number" 
                                  value={editCostInput}
                                  onChange={(e) => setEditCostInput(parseInt(e.target.value, 10) || 0)}
                                  style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.85rem' }}
                                />
                                <button 
                                  className="btn-primary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, cost: editCostInput } : r));
                                    setEditingRewardId(null);
                                  }}
                                >
                                  Save
                                </button>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => setEditingRewardId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{reward.name}</span>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', border: '1px dashed rgba(255,255,255,0.2)' }}
                                  onClick={() => {
                                    setEditingRewardId(reward.id);
                                    setEditCostInput(reward.cost);
                                  }}
                                >
                                  Edit Cost
                                </button>
                              </div>
                            )}
                            
                            {editingRewardId !== reward.id && (
                              <button 
                                className="btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: 'none', color: '#ef4444' }}
                                onClick={() => setRewards(prev => prev.filter(r => r.id !== reward.id))}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{studentPoints} / {reward.cost} pts</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-color)', transition: 'width 0.3s ease' }}></div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {incompleteRewards.length > 5 && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowAllIncompleteRewards(!showAllIncompleteRewards)}
                      style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
                    >
                      {showAllIncompleteRewards ? 'Show Less' : `Show More (${incompleteRewards.length - 5} more)`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* COLUMN 2: REDEMPTION & FULFILLMENT */}
            <div style={{ flex: '1 1 360px', minWidth: '320px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--success-color)' }}>🎁 Fulfillment Control</h3>
              
              {readyToRedeemRewards.length === 0 && redeemedRewards.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0', fontStyle: 'italic' }}>No claimed or fulfilled rewards yet.</p>
              ) : (
                <>
                  {readyToRedeemRewards.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {readyToRedeemRewards.map(reward => (
                        <li key={reward.id} style={{ padding: '1rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {editingRewardId === reward.id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input 
                                  type="number" 
                                  value={editCostInput}
                                  onChange={(e) => setEditCostInput(parseInt(e.target.value, 10) || 0)}
                                  style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.85rem' }}
                                />
                                <button 
                                  className="btn-primary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, cost: editCostInput } : r));
                                    setEditingRewardId(null);
                                  }}
                                >
                                  Save
                                </button>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => setEditingRewardId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>{reward.name}</span>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', border: '1px dashed rgba(255,255,255,0.2)' }}
                                  onClick={() => {
                                    setEditingRewardId(reward.id);
                                    setEditCostInput(reward.cost);
                                  }}
                                >
                                  Edit Cost
                                </button>
                              </div>
                            )}
                            
                            {editingRewardId !== reward.id && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button 
                                  className="btn-primary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'var(--success-color)', border: 'none', color: 'white', fontWeight: 'bold' }}
                                  onClick={() => redeemReward(reward.id)}
                                >
                                  🎁 Mark Redeemed
                                </button>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: 'none', color: '#ef4444' }}
                                  onClick={() => setRewards(prev => prev.filter(r => r.id !== reward.id))}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Progress: {studentPoints} / {reward.cost} pts</span>
                            <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Ready to Fulfill!</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    readyToRedeemRewards.length === 0 && redeemedRewards.length > 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>✓ All completed milestones fulfilled!</p>
                    )
                  )}

                  {redeemedRewards.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setShowCompletedRewards(!showCompletedRewards)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
                      >
                        {showCompletedRewards ? 'Hide Redeemed History' : `Show Redeemed History (${redeemedRewards.length})`}
                      </button>
                      
                      {showCompletedRewards && (
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                          {redeemedRewards.map(reward => (
                            <li key={reward.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {editingRewardId === reward.id ? (
                                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <input 
                                      type="number" 
                                      value={editCostInput}
                                      onChange={(e) => setEditCostInput(parseInt(e.target.value, 10) || 0)}
                                      style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', fontSize: '0.85rem' }}
                                    />
                                    <button 
                                      className="btn-primary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                      onClick={() => {
                                        setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, cost: editCostInput } : r));
                                        setEditingRewardId(null);
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button 
                                      className="btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                      onClick={() => setEditingRewardId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{reward.name}</span>
                                    <span style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '12px', fontWeight: 'bold', marginRight: '0.5rem' }}>
                                      FULFILLED
                                    </span>
                                    <button 
                                      className="btn-secondary"
                                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', border: '1px dashed rgba(255,255,255,0.2)' }}
                                      onClick={() => {
                                        setEditingRewardId(reward.id);
                                        setEditCostInput(reward.cost);
                                      }}
                                    >
                                      Edit Cost
                                    </button>
                                  </div>
                                )}
                                
                                {editingRewardId !== reward.id && (
                                  <button 
                                    className="btn-secondary"
                                    style={{ padding: '0.2rem 0.4rem', border: 'none', color: '#ef4444' }}
                                    onClick={() => setRewards(prev => prev.filter(r => r.id !== reward.id))}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>Cost: {reward.cost} pts</span>
                                <span>100%</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Experience Pacing Configuration */}
        {/* Adaptive Pacing Switch: Toggles linear milestone progression gating (max 3 sections ahead) */}
        {/* versus an unrestricted sandbox exploration mode. */}
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
        {/* Sequential Lock Hook: Gating binary enforcing linear completion sequence (Easy -> Medium -> Hard) */}
        {/* requiring mastery before unlocking advanced complexity modes. */}
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
        <h2 style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>Reset Selected Student Progress</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          This will wipe all points, streak data, struggle words, section high scores, and reset tier unlocking for the currently selected student profile. Other child accounts are not affected. It cannot be undone.
        </p>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--error-color)', color: 'white', border: 'none' }}
          onClick={() => setShowResetModal(true)}
        >
          Reset Profile Progress
        </button>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {/* Custom Reset Confirmation Modal: Teleports confirmation dialog via createPortal */}
      {/* over a blurred glassmorphism backdrop to prevent accidental student progress loss. */}
      {showResetModal && createPortal(
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
              Are you absolutely sure you want to reset progress for this student profile? This cannot be undone!
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
        </div>,
        document.body
      )}

      {/* Add Student Modal */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" role="dialog" aria-modal="true" style={{
            padding: '2.5rem', maxWidth: '450px', width: '90%', textAlign: 'left',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
            borderTop: '4px solid #10b981'
          }}>
            <h2 style={{ color: '#10b981', marginBottom: '1.5rem', textAlign: 'center' }}>+ Add New Student Profile</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newChildName.trim()) {
                addChild(newChildName.trim(), newChildGrade);
                setNewChildName('');
                setNewChildGrade('4th');
                setShowAddModal(false);
              }
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Student Name</label>
                <input 
                  type="text" 
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter name (e.g., Bobby)"
                  required
                  maxLength={30}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    background: 'rgba(0,0,0,0.3)', 
                    color: 'white',
                    border: '1px solid var(--surface-border)',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Starting Grade Level</label>
                <select 
                  value={newChildGrade}
                  onChange={(e) => setNewChildGrade(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    background: 'rgba(0,0,0,0.3)', 
                    color: 'white',
                    border: '1px solid var(--surface-border)',
                    outline: 'none'
                  }}
                >
                  <option value="2nd" style={{color: 'black'}}>2nd Grade (Basic Phonics & Sight Words)</option>
                  <option value="3rd" style={{color: 'black'}}>3rd Grade (Phonetic Focus)</option>
                  <option value="4th" style={{color: 'black'}}>4th Grade (Building Blocks)</option>
                  <option value="5th" style={{color: 'black'}}>5th Grade (Advanced Word Study)</option>
                  <option value="6th" style={{color: 'black'}}>6th Grade (Advanced Roots)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#10b981', color: 'white', border: 'none' }}>
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ParentPortal;
