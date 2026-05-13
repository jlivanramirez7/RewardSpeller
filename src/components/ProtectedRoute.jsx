import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const [approved, setApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkApproval = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (mounted) {
            if (docSnap.exists() && docSnap.data().isApproved) {
              setApproved(true);
            } else {
              setApproved(false);
            }
          }
        } catch (error) {
          console.error("Error checking approval:", error);
          // Optionally handle error state here
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
  }, [user, loading]);

  if (loading || checkingApproval) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin) {
    // Hardcoded admin for now as per user request
    if (user.email !== 'jlivanramirez7@gmail.com') {
      return <Navigate to="/" />; // Redirect non-admins to home
    }
  }

  if (!approved && user.email !== 'jlivanramirez7@gmail.com') {
    return <Navigate to="/request-access" />;
  }

  return children;
};

export default ProtectedRoute;
