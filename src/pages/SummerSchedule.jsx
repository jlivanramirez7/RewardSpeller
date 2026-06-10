import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { scheduleData } from '../data/scheduleData';
import { Check, Calendar, BookOpen, Layers, Award } from 'lucide-react'; // Icons

/**
 * @component SummerSchedule
 * @description Renders the 10-week summer preparation schedule. Allows checking off topics
 * and displays progress telemetry. Persists progress dynamically in Firestore via AppContext.
 */
const SummerSchedule = () => {
  const { summerProgress, toggleSummerProgress, isLoaded, studentName } = useAppContext();
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  // Calculate stats based on current student data
  const stats = useMemo(() => {
    let total = 0;
    scheduleData.forEach(week => {
      total += week.days.length;
    });
    const completed = summerProgress?.length || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      remaining: total - completed,
      rate
    };
  }, [summerProgress]);

  if (!isLoaded) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Summer Schedule...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Master Summer Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Day-by-day plan for {studentName || 'Student'} • May 30 – August 2, 2026
          </p>
        </div>
        
        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#1c2541' }}>All Weeks</option>
            {scheduleData.map(w => (
              <option key={w.week} value={w.week} style={{ background: '#1c2541' }}>Week {w.week}</option>
            ))}
          </select>

          <button 
            className="btn-secondary"
            onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
            style={{
              padding: '0.5rem 1rem',
              background: showIncompleteOnly ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              borderColor: showIncompleteOnly ? 'transparent' : 'var(--surface-border)'
            }}
          >
            {showIncompleteOnly ? 'Showing Incomplete Only' : 'Show Incomplete Only'}
          </button>
        </div>
      </div>

      {/* Quick Telemetry Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Topics</span>
          <span style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>65 Days Plan</span>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed Topics</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-color)' }}>{stats.completed}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{stats.remaining} days remaining</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Completion Rate</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{stats.rate}%</span>
          <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-cyan)', width: `${stats.rate}%`, height: '100%', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {scheduleData.map(week => {
          if (selectedWeek !== 'all' && week.week.toString() !== selectedWeek) {
            return null;
          }

          let daysToRender = week.days;
          if (showIncompleteOnly) {
            daysToRender = week.days.filter(day => !summerProgress.includes(day.date));
          }

          if (daysToRender.length === 0) {
            return null;
          }

          return (
            <div key={week.week} className="glass-panel" style={{ overflow: 'hidden' }}>
              
              {/* Week Header */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '1.25rem 2rem',
                borderBottom: '1px solid var(--surface-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Calendar size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Week {week.week}: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{week.focus}</span>
                </h2>
              </div>

              {/* Days List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {daysToRender.map((day, idx) => {
                  const isChecked = summerProgress.includes(day.date);
                  
                  return (
                    <div 
                      key={day.date} 
                      style={{
                        padding: '2rem',
                        borderBottom: idx === daysToRender.length - 1 ? 'none' : '1px solid var(--surface-border)',
                        background: isChecked ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        transition: 'background 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        
                        {/* Checkbox and Day Title */}
                        <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
                          <button
                            onClick={() => toggleSummerProgress(day.date)}
                            style={{
                              background: isChecked ? 'var(--success-color)' : 'transparent',
                              border: isChecked ? 'none' : '2px solid var(--surface-border)',
                              borderRadius: '8px',
                              width: '40px',
                              height: '40px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isChecked && <Check size={20} color="white" />}
                          </button>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {day.day}, {day.date}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--accent-cyan)',
                                background: 'rgba(0, 180, 216, 0.1)',
                                border: '1px solid rgba(0, 180, 216, 0.2)',
                                borderRadius: '4px',
                                padding: '0.1rem 0.5rem',
                                fontWeight: 600
                              }}>
                                {day.standard.split(':')[0]}
                              </span>
                            </div>
                            <h3 style={{
                              fontSize: '1.15rem',
                              fontWeight: 700,
                              textDecoration: isChecked ? 'line-through' : 'none',
                              color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)'
                            }}>
                              {day.standard.split(':').slice(1).join(':').trim()}
                            </h3>
                          </div>
                        </div>

                        {/* Assessment Action */}
                        <div>
                          <button
                            disabled
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--surface-border)',
                              opacity: 0.5,
                              cursor: 'not-allowed',
                              fontSize: '0.85rem',
                              padding: '0.5rem 1rem'
                            }}
                          >
                            Quiz Lock
                          </button>
                        </div>
                      </div>

                      {/* Subdetails grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        paddingLeft: '3.75rem'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <BookOpen size={16} style={{ color: 'var(--accent-cyan)' }} /> Pedagogical Approach
                          </span>
                          <span>{day.approach}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Layers size={16} style={{ color: 'var(--accent-cyan)' }} /> Target Volume
                          </span>
                          <span>{day.volume}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Award size={16} style={{ color: 'var(--accent-cyan)' }} /> Modality & Interests
                          </span>
                          <span>{day.integration}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SummerSchedule;
