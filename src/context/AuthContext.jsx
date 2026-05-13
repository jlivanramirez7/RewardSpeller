import { createContext, useContext, useEffect, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const init = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const rawConfig = await response.json();
        
        if (!isMounted) return;

        // Map keys from VITE_ prefixes to what Firebase expects
        const config = {
          apiKey: rawConfig.VITE_FIREBASE_API_KEY,
          authDomain: rawConfig.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: rawConfig.VITE_FIREBASE_PROJECT_ID,
          storageBucket: rawConfig.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: rawConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: rawConfig.VITE_FIREBASE_APP_ID,
          measurementId: rawConfig.VITE_FIREBASE_MEASUREMENT_ID
        };

        // Check if app is already initialized
        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        setAuthInstance(auth);
        setDbInstance(db);
        
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });
        
        setFirebaseInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        if (isMounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = () => {
    if (!authInstance) return Promise.reject('Auth not initialized');
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider);
  };

  const signOut = () => {
    if (!authInstance) return Promise.reject('Auth not initialized');
    return firebaseSignOut(authInstance);
  };

  const value = {
    user,
    signInWithGoogle,
    signOut,
    loading,
    db: dbInstance
  };

  if (error) {
    return <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>Error loading configuration: {error}</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {firebaseInitialized && !loading ? children : <div>Loading Configuration...</div>}
    </AuthContext.Provider>
  );
};
