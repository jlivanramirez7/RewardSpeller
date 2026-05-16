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
  const { user, signInWithGoogle, db, loading, isAdmin, isStudent, parentUid } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const checkUser = async () => {
      if (user && db && !loading) {
        if (isAdmin) {
          if (mounted) navigate('/');
          return;
        }
        try {
          console.log(`[LOGIN useEffect] Evaluating active session for ${user.email}. isStudent: ${isStudent}, parentUid: ${parentUid}`);
          const targetUid = isStudent ? parentUid : user.uid;
          const docSnap = await getDoc(doc(db, 'users', targetUid));
          console.log(`[LOGIN useEffect] Target UID ${targetUid} exists: ${docSnap.exists()}, isApproved: ${docSnap.exists() && docSnap.data().isApproved}`);
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
  }, [user, db, loading, navigate, isAdmin, isStudent, parentUid]);

  const authenticateAndFetchUser = async () => {
    console.log(`[LOGIN] Initiating Google OAuth popup sign-in...`);
    const result = await signInWithGoogle();
    const authUser = result.user;
    console.log(`[LOGIN] Successfully authenticated Google user: ${authUser.email} (UID: ${authUser.uid})`);
    
    if (!db) {
      throw new Error("Database connection not established. Please check your network or configuration.");
    }

    if (isAdmin || authUser.email === 'jlivanramirez7@gmail.com') {
      console.log(`[LOGIN] User is Admin/Master Parent. Auto-approving.`);
      return { authUser, isApproved: true };
    }

    console.log(`[LOGIN] Probing student_links collection in Firestore for email: "${authUser.email}"...`);
    let targetUid = authUser.uid;
    try {
      const linkDoc = await getDoc(doc(db, 'student_links', authUser.email));
      if (linkDoc.exists()) {
        targetUid = linkDoc.data().parentUid;
        console.log(`[LOGIN] SUCCESS: Found student link! Routing approval check to Parent UID: ${targetUid} (Child ID: ${linkDoc.data().childId})`);
      } else {
        console.warn(`[LOGIN] WARNING: No student link found in Firestore for "${authUser.email}". Treating as standalone account.`);
        console.log(`[LOGIN TIP] If this is a student, the parent must log into Parent Portal first and link "${authUser.email}" to the child profile.`);
      }
    } catch (err) {
      console.error("Error checking student link during login:", err);
    }

    console.log(`[LOGIN] Querying users collection for approval status of UID: ${targetUid}...`);
    const docRef = doc(db, 'users', targetUid);
    const docSnap = await getDoc(docRef);
    const isApproved = docSnap.exists() && docSnap.data().isApproved;
    console.log(`[LOGIN] Approval verification result for UID ${targetUid}: ${isApproved} (Document exists: ${docSnap.exists()})`);
    
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
