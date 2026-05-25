/**
 * @file Leaderboard.jsx
 * @description Gamified student leaderboard component. Displays students within the active grade level,
 * ranking them by total or weekly earned points. Highlights the logged-in student's row with emerald accents.
 */

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useAppContext, getISOWeekString } from '../context/AppContext';
import { generateKidFriendlyName } from '../utils/username';

/**
 * @component Leaderboard
 * @param {Object} props
 * @param {string} props.currentGradeLevel - Active curriculum grade level (e.g., '4th').
 * @returns {React.ReactElement} Gamified leaderboard UI panel.
 */
const Leaderboard = ({ currentGradeLevel }) => {
  const { user, db, isStudent, parentUid } = useAuth();
  const { activeChildId } = useAppContext();
  const [rawStudents, setRawStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('total'); // 'total' | 'weekly'

  useEffect(() => {
    if (!db) return;

    const currentWeek = getISOWeekString();
    const unsubscribe = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
      const students = [];

      usersSnapshot.forEach((docSnapshot) => {
        const userId = docSnapshot.id;
        const data = docSnapshot.data();
        
        if (data.children && typeof data.children === 'object') {
          Object.entries(data.children).forEach(([childId, child]) => {
            if (child.currentGradeLevel === currentGradeLevel) {
              let displayName = child.studentName ? child.studentName.trim() : '';
              if (!displayName || displayName.toLowerCase() === 'student') {
                displayName = generateKidFriendlyName(childId);
              }

              const totalPoints = child.studentPoints || 0;
              let lastResetWeek = child.lastResetWeek || currentWeek;
              let weeklyPoints = child.weeklyPoints !== undefined ? child.weeklyPoints : Math.round(totalPoints * 0.25);

              if (lastResetWeek !== currentWeek) {
                weeklyPoints = 0;
              }

              students.push({
                userId,
                childId,
                displayName,
                totalPoints,
                weeklyPoints
              });
            }
          });
        } else if (data.studentPoints !== undefined || data.currentGradeLevel !== undefined) {
          // Legacy single-student document fallback
          let grade = data.currentGradeLevel || '4th';
          if (grade === '4th-5th') grade = '4th';
          if (grade === '6th+') grade = '6th';
          const validGrades = ['2nd', '3rd', '4th', '5th', '6th'];
          if (!validGrades.includes(grade)) grade = '4th';

          if (grade === currentGradeLevel) {
            let displayName = data.studentName ? data.studentName.trim() : '';
            if (!displayName || displayName.toLowerCase() === 'student') {
              displayName = generateKidFriendlyName('child_1');
            }

            const totalPoints = data.studentPoints || 0;
            let lastResetWeek = data.lastResetWeek || currentWeek;
            let weeklyPoints = data.weeklyPoints !== undefined ? data.weeklyPoints : Math.round(totalPoints * 0.25);

            if (lastResetWeek !== currentWeek) {
              weeklyPoints = 0;
            }

            students.push({
              userId,
              childId: 'child_1',
              displayName,
              totalPoints,
              weeklyPoints
            });
          }
        }
      });

      setRawStudents(students);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentGradeLevel]);

  const leaderboardData = useMemo(() => {
    const sorted = [...rawStudents].sort((a, b) => {
      return sortBy === 'weekly' ? b.weeklyPoints - a.weeklyPoints : b.totalPoints - a.totalPoints;
    });

    const result = [];
    let currentRank = 1;
    let previousPoints = null;

    for (let i = 0; i < sorted.length; i++) {
      const student = sorted[i];
      const points = sortBy === 'weekly' ? student.weeklyPoints : student.totalPoints;
      if (previousPoints !== null && points < previousPoints) {
        currentRank = i + 1;
      }
      previousPoints = points;
      result.push({ ...student, rank: currentRank });
    }

    return result;
  }, [rawStudents, sortBy]);

  const handleSort = (type) => {
    setSortBy(type);
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>Loading Grade {currentGradeLevel} Leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--error-color)' }}>
        <p style={{ color: 'var(--error-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Grade {currentGradeLevel} Leaderboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            See how you rank against other Jedi Spellers in your grade!
          </p>
        </div>
        
        {/* Sorting Toggle Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <button
            onClick={() => handleSort('total')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              borderRadius: '6px',
              background: sortBy === 'total' ? 'var(--accent-color)' : 'transparent',
              color: sortBy === 'total' ? 'white' : 'var(--text-secondary)',
              fontWeight: sortBy === 'total' ? 'bold' : 'normal',
              boxShadow: sortBy === 'total' ? '0 2px 8px rgba(244, 63, 94, 0.4)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Total Points
          </button>
          <button
            onClick={() => handleSort('weekly')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              borderRadius: '6px',
              background: sortBy === 'weekly' ? 'var(--accent-color)' : 'transparent',
              color: sortBy === 'weekly' ? 'white' : 'var(--text-secondary)',
              fontWeight: sortBy === 'weekly' ? 'bold' : 'normal',
              boxShadow: sortBy === 'weekly' ? '0 2px 8px rgba(244, 63, 94, 0.4)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            This Week
          </button>
        </div>
      </div>

      {leaderboardData.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No students found in Grade {currentGradeLevel} yet. Be the first to earn points!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', width: '110px' }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Points This Week</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((student) => {
                const targetUserId = isStudent ? parentUid : user?.uid;
                const isCurrentUser = student.userId === targetUserId && student.childId === activeChildId;
                const rank = student.rank;
                
                let rankBadge = <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{rank}</span>;
                if (rank === 1) rankBadge = <span style={{ background: '#fbbf24', color: '#1f2937', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(251,191,36,0.4)', display: 'inline-block', whiteSpace: 'nowrap' }}>🥇 1st</span>;
                else if (rank === 2) rankBadge = <span style={{ background: '#94a3b8', color: '#1f2937', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-block', whiteSpace: 'nowrap' }}>🥈 2nd</span>;
                else if (rank === 3) rankBadge = <span style={{ background: '#b45309', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-block', whiteSpace: 'nowrap' }}>🥉 3rd</span>;

                return (
                  <tr 
                    key={`${student.userId}-${student.childId}`}
                    style={{
                      background: isCurrentUser ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{ 
                      padding: '1rem', 
                      borderTopLeftRadius: '8px', 
                      borderBottomLeftRadius: '8px',
                      borderTop: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderBottom: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderLeft: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      whiteSpace: 'nowrap',
                      minWidth: '110px'
                    }}>
                      {rankBadge}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      borderTop: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderBottom: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', color: isCurrentUser ? '#10b981' : 'white', fontSize: '1.1rem' }}>
                          {student.displayName}
                        </span>
                        {isCurrentUser && (
                          <span style={{ background: '#10b981', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      color: '#fb923c',
                      borderTop: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderBottom: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)'
                    }}>
                      {student.weeklyPoints} pts
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold', 
                      color: '#fbbf24',
                      fontSize: '1.1rem',
                      borderTopRightRadius: '8px', 
                      borderBottomRightRadius: '8px',
                      borderTop: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderBottom: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)',
                      borderRight: isCurrentUser ? '2px solid #10b981' : '1px solid var(--surface-border)'
                    }}>
                      {student.totalPoints} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
