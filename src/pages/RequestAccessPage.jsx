import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const RequestAccessPage = () => {
  const { user, signOut, db } = useAuth();
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, 'access_requests', user.uid), {
        email: user.email,
        displayName: user.displayName,
        reason: reason,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit request", error);
      alert("Failed to submit request: " + error.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Request Submitted</h2>
        <p>Your request for access has been submitted. Please wait for the administrator to approve it.</p>
        <button className="btn-secondary" onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h2>Request Access</h2>
      <p>You are logged in as <strong>{user?.email}</strong> but do not have access to this application yet.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem' }}>Reason for Access (Optional)</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', height: '100px' }}
            placeholder="E.g., I am a student/parent of SummerSpelling."
          />
        </div>
        <button type="submit" className="btn-primary">Submit Request</button>
      </form>
      <button className="btn-secondary" onClick={() => signOut()} style={{ marginTop: '1rem' }}>Sign Out</button>
    </div>
  );
};

export default RequestAccessPage;
