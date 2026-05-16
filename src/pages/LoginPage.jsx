import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @component LoginPage
 * @description Authentication entry point. Displays options for signing in via Google OAuth
 * or requesting onboarding access. Implements automatic route redirection based on approval status.
 *
 * @returns {React.ReactElement} The login landing page UI.
 */
const LoginPage = () => {
  const { user, signInWithGoogle, db, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect checking hook: Evaluates active user session and queries Firestore
  // to automatically navigate approved users to the student portal or unapproved users to the request page.
  useEffect(() => {
    let mounted = true;
    const checkUser = async () => {
      if (user && db && !loading) {
        if (isAdmin) {
          if (mounted) navigate('/');
          return;
        }
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (mounted) {
            if (docSnap.exists() && docSnap.data().isApproved) {
              navigate('/');
            } else {
              navigate('/request-access');
            }
          }
        } catch (err) {
          console.error("Error auto-redirecting:", err);
        }
      }
    };
    checkUser();
    return () => { mounted = false; };
  }, [user, db, loading, navigate, isAdmin]);

  const authenticateAndFetchUser = async () => {
    const result = await signInWithGoogle();
    const authUser = result.user;
    
    if (!db) {
      throw new Error("Database connection not established. Please check your network or configuration.");
    }

    if (isAdmin || authUser.email === 'jlivanramirez7@gmail.com') {
      return { authUser, isApproved: true };
    }

    const docRef = doc(db, 'users', authUser.uid);
    const docSnap = await getDoc(docRef);
    const isApproved = docSnap.exists() && docSnap.data().isApproved;
    
    return { authUser, isApproved };
  };

  const handleLogin = async () => {
    try {
      const { isApproved } = await authenticateAndFetchUser();
      if (isApproved) {
        navigate('/');
      } else {
        alert("Your account has not been approved yet. Redirecting to Request Access page...");
        navigate('/request-access');
      }
    } catch (error) {
      console.error("Failed to log in", error);
      alert("Failed to log in: " + error.message);
    }
  };

  const handleRequestAccess = () => {
    navigate('/request-access');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh' 
    }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome to RewardSpeller</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please choose an option below to continue</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleLogin}
            style={{ width: '100%' }}
          >
            Sign in (Approved Users)
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={handleRequestAccess}
            style={{ width: '100%' }}
          >
            Request Access (Parents)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
