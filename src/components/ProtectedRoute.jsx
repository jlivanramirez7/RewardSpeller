import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @component ProtectedRoute
 * @description Route guard wrapper that restricts view access based on authentication state,
 * account approval status in Firestore, and administrative privileges.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if permission checks pass.
 * @param {boolean} [props.requireAdmin=false] - If true, restricts route strictly to admin users.
 * @returns {React.ReactElement} The wrapped components or a `<Navigate>` redirect component.
 */
const ProtectedRoute = ({ children, requireAdmin = false, requireParent = false }) => {
  const { user, loading, db, isAdmin, isStudent, parentUid } = useAuth();
  const [approved, setApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [error, setError] = useState(null);

  // Asynchronous access verification hook: Queries Firestore 'users' collection to verify if 'isApproved' is true.
  // Utilizes a 'mounted' flag to prevent setting state if the route changes during network fetch.
  useEffect(() => {
    let mounted = true;
    const checkApproval = async () => {
      if (user && db) {
        if (isAdmin) {
          if (mounted) {
            setApproved(true);
            setCheckingApproval(false);
          }
          return;
        }
        try {
          const targetUid = isStudent ? parentUid : user.uid;
          console.log(`[PROTECTED ROUTE] Checking approval for user ${user.email}. isStudent: ${isStudent}, targetUid: ${targetUid}`);
          const docRef = doc(db, 'users', targetUid);
          const docSnap = await getDoc(docRef);
          
          if (mounted) {
            const approvedStatus = docSnap.exists() && docSnap.data().isApproved;
            console.log(`[PROTECTED ROUTE] Approval verification result for targetUid ${targetUid}: ${approvedStatus} (Doc exists: ${docSnap.exists()})`);
            if (approvedStatus) {
              setApproved(true);
            } else {
              setApproved(false);
            }
          }
        } catch (error) {
          console.error("Error checking approval:", error);
          if (mounted) {
            setError("Failed to verify account approval status. Please check your network connection or contact support.");
          }
        } finally {
          if (mounted) {
            setCheckingApproval(false);
          }
        }
      } else {
        if (mounted) {
          setCheckingApproval(false);
        }
      }
    };

    if (!loading) {
      checkApproval();
    }
    return () => { mounted = false; };
  }, [user, loading, db, isAdmin, isStudent, parentUid]);

  if (loading || checkingApproval) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verifying access permissions...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--error-color)', padding: '2rem', textAlign: 'center' }}>{error}</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin) {
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
  }

  if (requireParent) {
    if (isStudent) {
      return <Navigate to="/" />;
    }
  }

  if (!approved && !isAdmin) {
    return <Navigate to="/request-access" />;
  }

  return children;
};

export default ProtectedRoute;
