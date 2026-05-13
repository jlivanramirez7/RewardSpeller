import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Failed to log in", error);
      alert("Failed to log in: " + error.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh' 
    }}>
      <h1>Welcome to SummerSpelling</h1>
      <p>Please sign in to continue</p>
      <button 
        className="btn-primary" 
        onClick={handleLogin}
        style={{ marginTop: '1rem' }}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginPage;
