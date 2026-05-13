import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, doc, updateDoc, setDoc } from 'firebase/firestore';

/**
 * @component AdminDashboard
 * @description Administrative operational command center. Enables administrators to review, approve,
 * or deny pending student/parent access requests and monitors global platform engagement metrics.
 *
 * @returns {React.ReactElement} The administrative control interface.
 */
const AdminDashboard = () => {
  const { user, db, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  // Asynchronous telemetry and requests fetcher hook: Queries Firestore 'access_requests' collection
  // for pending user onboarding applications and aggregates total points across all user documents.
  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        try {
          // Fetch pending requests
          const q = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
          const querySnapshot = await getDocs(q);
          const reqs = [];
          querySnapshot.forEach((doc) => {
            reqs.push({ id: doc.id, ...doc.data() });
          });
          setRequests(reqs);

          // Fetch all users for metrics
          const usersSnapshot = await getDocs(collection(db, 'users'));
          let totalPoints = 0;
          let totalUsers = 0;
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.studentPoints) {
              totalPoints += data.studentPoints;
            }
            totalUsers++;
          });
          setMetrics({ totalUsers, totalPoints });

        } catch (error) {
          console.error("Failed to fetch admin data", error);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [user, db, isAdmin]);

  // Approval handler: Atomic mutation updating access request status to 'approved' and creating/updating
  // the corresponding user document. { merge: true } is critical to prevent overwriting existing student progress.
  const handleApprove = async (requestId, userId, email) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'access_requests', requestId), {
        status: 'approved'
      });

      // Create or update user document with isApproved: true
      await setDoc(doc(db, 'users', userId), {
        email: email,
        isApproved: true
      }, { merge: true });

      // Refresh list
      setRequests(requests.filter(r => r.id !== requestId));
      alert(`Approved ${email}`);
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

  if (!isAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      
      <section style={{ marginBottom: '2rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h2>Metrics</h2>
        <p><strong>Total Users:</strong> {metrics.totalUsers}</p>
        <p><strong>Total Points Earned by All Students:</strong> {metrics.totalPoints}</p>
      </section>

      <section>
        <h2>Pending Access Requests</h2>
        {requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th>Name</th>
                <th>Email</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td>{req.displayName || 'N/A'}</td>
                  <td>{req.email}</td>
                  <td>{req.reason || 'N/A'}</td>
                  <td>
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
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
