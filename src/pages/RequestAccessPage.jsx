import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const RequestAccessPage = () => {
  const { user, signOut, db, signInWithGoogle, loading } = useAuth();
  const [reason, setReason] = useState('');
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'approved', 'denied'
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const checkExistingStatus = async () => {
      if (mounted) setChecking(true);
      if (user && db) {
        try {
          // Check if already approved
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (mounted && userDoc.exists() && userDoc.data().isApproved) {
            setRequestStatus('approved');
            setChecking(false);
            return;
          }

          // Check access_requests
          const reqDoc = await getDoc(doc(db, 'access_requests', user.uid));
          if (mounted) {
            if (reqDoc.exists()) {
               setRequestStatus(reqDoc.data().status);
            } else {
               setRequestStatus(null);
            }
          }
        } catch (err) {
          console.error("Error checking request status:", err);
        } finally {
          if (mounted) setChecking(false);
        }
      } else {
        if (mounted) {
          setRequestStatus(null);
          setReason('');
          setChecking(false);
        }
      }
    };

    if (!loading) {
      checkExistingStatus();
    }
    return () => { mounted = false; };
  }, [user, loading, db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, 'access_requests', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        reason: reason,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setRequestStatus('pending');
    } catch (error) {
      console.error("Failed to submit request", error);
      alert("Failed to submit request: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      setRequestStatus(null);
      setReason('');
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  if (loading || checking) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking access status...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Request Access to RewardSpeller</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please sign in with your Google account first so we know who is requesting access.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err) {
                  console.error("Sign in failed", err);
                }
              }}
              style={{ width: '100%' }}
            >
              Sign in with Google to Request Access
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requestStatus === 'approved') {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--success-color)' }}>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>Access Approved!</h2>
          <p style={{ marginBottom: '1.5rem' }}>Good news! Your access to RewardSpeller has already been approved.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Enter Student Portal</button>
        </div>
      </div>
    );
  }

  if (requestStatus === 'denied') {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--error-color)' }}>
          <h2 style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ marginBottom: '1.5rem' }}>Your request for access was denied by the administrator.</p>
          <button className="btn-secondary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  if (requestStatus === 'pending') {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid #fbbf24' }}>
          <h2 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Request Submitted</h2>
          <p style={{ marginBottom: '1.5rem' }}>Your request for access has been submitted. Please wait for the administrator to approve it.</p>
          <button className="btn-secondary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Request Access</h2>
        <p style={{ marginBottom: '1.5rem' }}>You are logged in as <strong>{user?.email}</strong> but do not have access to this application yet.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Reason for Access (Optional)</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              placeholder="E.g., I am a student/parent of RewardSpeller."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Submit Request</button>
        </form>
        <button className="btn-secondary" onClick={handleSignOut} style={{ width: '100%' }}>Sign Out</button>
      </div>
    </div>
  );
};

export default RequestAccessPage;
