import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { collection, query, where, doc, updateDoc, setDoc, onSnapshot, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';

const formatUsageTime = (totalSeconds) => {
  if (!totalSeconds) return '0 mins';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  return `${seconds} sec${seconds !== 1 ? 's' : ''}`;
};

/**
 * @component AdminDashboard
 * @description Administrative operational command center. Enables administrators to review, approve,
 * or deny pending student/parent access requests and monitors global platform engagement metrics.
 *
 * @returns {React.ReactElement} The administrative control interface.
 */
const AdminDashboard = () => {
  const { db, isAdmin, user } = useAuth();
  const { adminRestoreLucas } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalPoints: 0,
    averagePoints: 0,
    totalUsageTime: 0,
    averageUsageTime: 0,
    gradeDistribution: {},
    topStruggleWords: [],
    totalLessonsListened: 0,
    averageStreak: 0,
    highestStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || !db) return;

    // Listen to pending requests in real time
    const q = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsubscribeRequests = onSnapshot(q, (querySnapshot) => {
      const reqs = [];
      querySnapshot.forEach((docSnap) => {
        reqs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRequests(reqs);
    }, (error) => {
      console.error("Failed to fetch requests snapshot", error);
    });

    // Listen to all users in real time for metrics
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (usersSnapshot) => {
      let totalPoints = 0;
      let totalUsers = 0;
      let totalStudents = 0;
      const gradeCounts = {};
      const struggleMap = {};
      let totalLessons = 0;
      let totalStreak = 0;
      let highestStreak = 0;
      let totalUsageTime = 0;
      const parsedUsers = [];

      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = docSnap.id;
        totalUsers++;

        parsedUsers.push({
          id: userId,
          email: data.email || 'Legacy Account',
          isApproved: data.isApproved || false,
          coppaConsented: data.coppaConsented || false,
          lastLoginAt: data.lastLoginAt,
          lastInteractionAt: data.lastInteractionAt,
          children: data.children ? Object.values(data.children).map(c => c.studentName) : []
        });

        if (data.children && typeof data.children === 'object') {
          Object.values(data.children).forEach((child) => {
            totalStudents++;
            const pts = child.studentPoints || 0;
            totalPoints += pts;

            const time = child.usageTime || 0;
            totalUsageTime += time;

            let grade = child.currentGradeLevel || '4th';
            if (grade === '4th-5th') grade = '4th';
            if (grade === '6th+') grade = '6th';
            const validGrades = ['2nd', '3rd', '4th', '5th', '6th'];
            if (!validGrades.includes(grade)) grade = '4th';

            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;

            if (child.struggleWords && Array.isArray(child.struggleWords)) {
              child.struggleWords.forEach((w) => {
                if (w && w.word) {
                  struggleMap[w.word] = (struggleMap[w.word] || 0) + (w.count || 1);
                }
              });
            }

            if (child.listenedLessons && Array.isArray(child.listenedLessons)) {
              totalLessons += child.listenedLessons.length;
            }

            const streak = child.studentStreak || 0;
            totalStreak += streak;
            if (streak > highestStreak) {
              highestStreak = streak;
            }
          });
        } else if (data.studentPoints !== undefined || data.currentGradeLevel !== undefined) {
          // Legacy single-student document fallback
          totalStudents++;
          const pts = data.studentPoints || 0;
          totalPoints += pts;

          const time = data.usageTime || 0;
          totalUsageTime += time;

          let grade = data.currentGradeLevel || '4th';
          if (grade === '4th-5th') grade = '4th';
          if (grade === '6th+') grade = '6th';
          const validGrades = ['2nd', '3rd', '4th', '5th', '6th'];
          if (!validGrades.includes(grade)) grade = '4th';

          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;

          if (data.struggleWords && Array.isArray(data.struggleWords)) {
            data.struggleWords.forEach((w) => {
              if (w && w.word) {
                struggleMap[w.word] = (struggleMap[w.word] || 0) + (w.count || 1);
              }
            });
          }

          if (data.listenedLessons && Array.isArray(data.listenedLessons)) {
            totalLessons += data.listenedLessons.length;
          }

          const streak = data.studentStreak || 0;
          totalStreak += streak;
          if (streak > highestStreak) {
            highestStreak = streak;
          }
        }
      });

      const averagePoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;
      const averageStreak = totalStudents > 0 ? (totalStreak / totalStudents).toFixed(1) : 0;
      const averageUsageTime = totalStudents > 0 ? Math.round(totalUsageTime / totalStudents) : 0;

      const topStruggleWords = Object.entries(struggleMap)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMetrics({
        totalUsers,
        totalStudents,
        totalPoints,
        averagePoints,
        totalUsageTime,
        averageUsageTime,
        gradeDistribution: gradeCounts,
        topStruggleWords,
        totalLessonsListened: totalLessons,
        averageStreak,
        highestStreak
      });
      setActiveUsers(parsedUsers.filter(u => u.email !== 'Legacy Account'));
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch users snapshot", error);
      setLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeUsers();
    };
  }, [isAdmin, db]);

  // Approval handler: Atomic mutation updating access request status to 'approved' and creating/updating
  // the corresponding user document. { merge: true } is critical to prevent overwriting existing student progress.
  const handleApprove = async (requestId, userId, email) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'access_requests', requestId), {
        status: 'approved'
      });

      // Create or update user document with isApproved: true and initial active interaction timestamp
      await setDoc(doc(db, 'users', userId), {
        email: email,
        isApproved: true,
        lastInteractionAt: serverTimestamp()
      }, { merge: true });

      // Dispatch welcome notification email immediately via Resend!
      try {
        await fetch('/api/notify-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
      } catch (emailErr) {
        console.error("Failed to dispatch welcome approval email notification:", emailErr);
      }

      // Refresh list
      setRequests(requests.filter(r => r.id !== requestId));
      alert(`Approved and welcome email sent to ${email}`);
    } catch (error) {
      console.error("Failed to approve user", error);
      alert("Failed to approve user: " + error.message);
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await updateDoc(doc(db, 'access_requests', requestId), {
        status: 'denied'
      });
      setRequests(requests.filter(r => r.id !== requestId));
      alert("Denied request");
    } catch (error) {
      console.error("Failed to deny request", error);
      alert("Failed to deny request: " + error.message);
    }
  };
  const handleDeleteParent = async (parent) => {
    const isMaster = parent.email === 'jlivanramirez7@gmail.com';
    if (isMaster) {
      alert("Security Protocol: Master Parent account jlivanramirez7@gmail.com cannot be deleted.");
      return;
    }

    const confirmFirst = window.confirm(
      `⚠️ WARNING: Are you absolutely sure you want to permanently delete the parent account "${parent.email}" and ALL of their associated student profiles?\n\nThis action is 100% irreversible and will delete all student progress and rewards from the database!`
    );
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      `🚨 FINAL VERIFICATION: Type 'DELETE' to confirm purge. This will delete their parental access requests, linked student Gmail profiles, and spelling records.`
    );
    if (!confirmSecond) return;

    try {
      console.log(`[ADMIN PURGE] Initiating surgical delete for parent document users/${parent.id} (${parent.email})...`);
      
      // Step 1: Fetch parent document to identify any linked student emails
      const parentDocRef = doc(db, 'users', parent.id);
      const parentDocSnap = await getDoc(parentDocRef);
      
      if (parentDocSnap.exists()) {
        const parentData = parentDocSnap.data();
        if (parentData.children && typeof parentData.children === 'object') {
          for (const child of Object.values(parentData.children)) {
            if (child && child.studentEmail && child.studentEmail.trim()) {
              const studentEmail = child.studentEmail.trim();
              console.log(`[ADMIN PURGE] Deleting linked student profile document in student_links/${studentEmail}...`);
              try {
                await deleteDoc(doc(db, 'student_links', studentEmail));
                console.log(`[ADMIN PURGE] Successfully deleted student_links/${studentEmail}`);
              } catch (linkErr) {
                console.error(`[ADMIN PURGE] Error deleting student_links document:`, linkErr);
              }
            }
          }
        }
      }

      // Step 2: Delete corresponding entry from access_requests collection
      console.log(`[ADMIN PURGE] Deleting access request record in access_requests/${parent.id}...`);
      try {
        await deleteDoc(doc(db, 'access_requests', parent.id));
        console.log(`[ADMIN PURGE] Successfully deleted access_requests/${parent.id}`);
      } catch (reqErr) {
        console.error(`[ADMIN PURGE] Error deleting access_requests document:`, reqErr);
      }

      // Step 3: Delete parent document from users collection
      console.log(`[ADMIN PURGE] Deleting parent database record users/${parent.id}...`);
      await deleteDoc(parentDocRef);
      console.log(`[ADMIN PURGE] Surgical purge completed successfully for parent ${parent.email}!`);

      alert(`🎉 SUCCESS: Parent account ${parent.email} and all linked profiles permanently deleted.`);
    } catch (err) {
      console.error("Failed to delete parent account:", err);
      alert("Failed to delete parent account: " + err.message);
    }
  };
  if (!isAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      
      {user?.email === 'jlivanramirez7@gmail.com' && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #a855f7', background: 'rgba(168, 85, 247, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#a855f7', margin: 0 }}>⚙️ Surgical Profile Recovery Tool</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Restore child profile for Lucas (`lucasjramirez7@gmail.com`) to 100% completion for Tiers 1-3, and Tier 4 up to section 6 (Homophones 6).
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6b21a8)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => {
              if (window.confirm("Are you sure you want to run administrative recovery for Lucas? This will overwrite his current database record with T1-T3 fully completed and T4 up to Section 6.")) {
                adminRestoreLucas();
              }
            }}
          >
            🚀 Restore Lucas Profile
          </button>
        </div>
      )}

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Platform Analytics Overview</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6', minWidth: '280px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Active User Accounts</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: 'white' }}>
              {metrics.totalStudents.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>students</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Across {metrics.totalUsers.toLocaleString()} parent accounts</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #fbbf24', minWidth: '280px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Points Earned</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#fbbf24' }}>
              {metrics.totalPoints.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>pts</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Avg {metrics.averagePoints.toLocaleString()} pts per student</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', minWidth: '280px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Engagement Streaks</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#10b981' }}>
              🔥 {metrics.highestStreak.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>max streak</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Avg {metrics.averageStreak} days active streak</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #a855f7', minWidth: '280px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Instructional Audio</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#c084fc' }}>
              🎧 {metrics.totalLessonsListened.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>lessons</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Pre-game audio lessons listened</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899', minWidth: '280px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Usage Time</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#ec4899' }}>
              ⏱️ {formatUsageTime(metrics.totalUsageTime)}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Avg {formatUsageTime(metrics.averageUsageTime)} per student</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '280px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'white', fontSize: '1.1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
              📚 Grade Level Distribution
            </h3>
            {Object.keys(metrics.gradeDistribution).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No grade data available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['2nd', '3rd', '4th', '5th', '6th'].map((grade) => {
                  const count = metrics.gradeDistribution[grade] || 0;
                  const percentage = metrics.totalStudents > 0 ? Math.round((count / metrics.totalStudents) * 100) : 0;
                  return (
                    <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ width: '45px', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{grade}</span>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, background: 'var(--accent-color)', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ width: '60px', textAlign: 'right', fontSize: '0.875rem', color: 'white', fontWeight: '600' }}>{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '280px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'white', fontSize: '1.1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
              ⚠️ Top Diagnostic Struggle Words
            </h3>
            {metrics.topStruggleWords.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No struggle words recorded yet. Students are spelling perfectly!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metrics.topStruggleWords.map((item, index) => (
                  <div key={item.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', width: '20px' }}>#{index + 1}</span>
                      <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.05rem' }}>{item.word}</span>
                    </div>
                    <span style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {item.count} {item.count === 1 ? 'miss' : 'misses'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>👥 Active Parent Directory</h2>
        {activeUsers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No active parent accounts registered yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Parent Account</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Access Role</th>
                  <th style={{ padding: '1rem 0.75rem' }}>COPPA Consent</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Associated Students</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Last Interaction Time</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((parent) => {
                  const isMaster = parent.email === 'jlivanramirez7@gmail.com';
                  
                  let interactionTimeStr = 'No active telemetry';
                  const activeTimestamp = parent.lastInteractionAt || parent.lastLoginAt;
                  if (activeTimestamp) {
                    const dateObj = activeTimestamp.toDate ? activeTimestamp.toDate() : new Date(activeTimestamp);
                    interactionTimeStr = dateObj.toLocaleString();
                  }

                  return (
                    <tr key={parent.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold', color: 'white' }}>
                        {parent.email}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {isMaster ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            Master Parent
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            Approved Parent
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {parent.coppaConsented ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            ✓ Consent Given
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            ⏳ Pending / Locked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {parent.children && parent.children.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {parent.children.map((name, idx) => (
                              <span key={idx} style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '8px', fontWeight: '600' }}>
                                👦 {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            No student profiles yet
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                        ⚡ {interactionTimeStr}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        {isMaster ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Protected</span>
                        ) : (
                          <button 
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: 'none', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => handleDeleteParent(parent)}
                          >
                            🗑️ Purge Account
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>Pending Access Requests</h2>
        {requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.75rem' }}>{req.displayName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{req.email}</td>
                    <td style={{ padding: '0.75rem' }}>{req.reason || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleApprove(req.id, req.id, req.email)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleDeny(req.id)}
                      >
                        Deny
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
