/**
 * @module AuthContext
 * @description Authentication provider utilizing Firebase Auth and Firestore. Manages user sessions,
 * Google OAuth popups, server configuration fetching, and administrator role validation.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const AuthContext = createContext();

/**
 * Custom hook to consume the authentication context.
 *
 * @returns {{
 *   user: Object|null,
 *   signInWithGoogle: Function,
 *   signOut: Function,
 *   loading: boolean,
 *   db: Object|null,
 *   isAdmin: boolean
 * }} Authentication session state, Firestore instance, and auth helper functions.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

/**
 * Component providing authentication state across the React component tree.
 * Dynamically resolves Firebase configuration parameters from backend `/api/config` middleware.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components requiring authentication context access.
 * @returns {React.ReactElement} Authentication context provider wrapper.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Asynchronous initialization hook: Fetches environment configuration from Express middleware,
  // maps VITE_ prefixed keys to Firebase config schema, and instantiates Firebase Auth/Firestore singletons.
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

  /**
   * Initiates Google OAuth popup authentication flow.
   * @returns {Promise} Promise resolving to the UserCredential upon successful authentication.
   */
  const signInWithGoogle = () => {
    if (!authInstance) return Promise.reject('Auth not initialized');
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider);
  };

  /**
   * Signs out the currently authenticated user session.
   * @returns {Promise} Promise resolving upon successful sign out.
   */
  const signOut = () => {
    if (!authInstance) return Promise.reject('Auth not initialized');
    return firebaseSignOut(authInstance);
  };

  const value = {
    user,
    signInWithGoogle,
    signOut,
    loading,
    db: dbInstance,
    isAdmin: user ? user.email === 'jlivanramirez7@gmail.com' : false
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
