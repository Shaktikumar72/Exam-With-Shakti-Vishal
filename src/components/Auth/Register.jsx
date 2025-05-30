import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile, sendEmailVerification, signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import './Auth.css';

// List of known disposable email domains (partial list for demonstration)
const disposableDomains = [
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
  'getnada.com',
  'dispostable.com',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef(null); // To store interval ID for cleanup
  const userRef = useRef(null); // To store the user object
  const isRegistrationActive = useRef(false); // Track if registration is in progress

  // Check if user has verified their email
  const checkEmailVerification = async (user) => {
    try {
      await user.reload(); // Refresh user data
      console.log('User emailVerified status:', user.emailVerified); // Debug log
      if (user.emailVerified) {
        console.log('Email verified, completing registration...'); // Debug log
        clearInterval(intervalRef.current);
        intervalRef.current = null; // Ensure interval is cleared
        setShowVerificationPopup(false);
        // Update user profile and save to Firestore
        await updateProfile(user, { displayName: name });
        console.log('Profile updated with name:', name); // Debug log
        await setDoc(doc(db, 'users', user.uid), { name, email, registeredAt: new Date() });
        console.log('User data saved to Firestore:', { name, email }); // Debug log
        navigate('/dashboard');
        console.log('Navigated to /dashboard'); // Debug log
      }
    } catch (err) {
      console.error('Error in checkEmailVerification:', err); // Debug log
      if (err.code === 'auth/user-token-expired') {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setError('Session expired. Please try registering again.');
        await cleanupUser();
        setShowVerificationPopup(false);
      } else {
        setError(err.message);
      }
    }
  };

  // Cleanup user and sign out
  const cleanupUser = async () => {
    if (userRef.current) {
      try {
        console.log('Cleaning up user:', userRef.current.uid); // Debug log
        await deleteUser(userRef.current); // Delete unverified user
        console.log('User deleted successfully'); // Debug log
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
    await signOut(auth);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');
    isRegistrationActive.current = true; // Mark registration as active

    // Check for disposable email domains
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(emailDomain)) {
      setError('Please use a real email address. Disposable emails are not allowed.');
      isRegistrationActive.current = false;
      return;
    }

    try {
      console.log('Starting email registration for:', email); // Debug log
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      userRef.current = user; // Store user object for cleanup
      console.log('User created in Firebase:', user.uid); // Debug log

      // Send email verification
      await sendEmailVerification(user);
      console.log('Verification email sent to:', email); // Debug log
      setShowVerificationPopup(true);

      // Start polling for email verification
      intervalRef.current = setInterval(() => checkEmailVerification(user), 3000);
      console.log('Started polling for email verification'); // Debug log

      // Set a timeout to prevent infinite polling (5 minutes)
      setTimeout(async () => {
        if (intervalRef.current && isRegistrationActive.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (!user.emailVerified) {
            setError('Verification timeout. Please try again or check your email.');
            await cleanupUser();
            setShowVerificationPopup(false);
          }
        }
      }, 300000); // 5 minutes timeout
    } catch (err) {
      console.error('Error in handleEmailRegister:', err); // Debug log
      setError(err.message);
      isRegistrationActive.current = false;
    }
  };

  const handleGoogleRegister = async () => {
    try {
      console.log('Starting Google registration'); // Debug log
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      userRef.current = user;
      isRegistrationActive.current = true;
      console.log('Google user signed in:', user.uid); // Debug log

      // Check for disposable email domains
      const emailDomain = user.email.split('@')[1]?.toLowerCase();
      if (disposableDomains.includes(emailDomain)) {
        await deleteUser(user).catch((err) => console.error('Error deleting user:', err));
        await signOut(auth);
        setError('Please use a real email address. Disposable emails are not allowed.');
        isRegistrationActive.current = false;
        return;
      }

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        console.log('Verification email sent to:', user.email); // Debug log
        setShowVerificationPopup(true);

        intervalRef.current = setInterval(() => checkEmailVerification(user), 3000);
        console.log('Started polling for email verification (Google)'); // Debug log

        setTimeout(async () => {
          if (intervalRef.current && isRegistrationActive.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            if (!user.emailVerified) {
              setError('Verification timeout. Please try again or check your email.');
              await deleteUser(user).catch((err) => console.error('Error deleting user:', err));
              await signOut(auth);
              setShowVerificationPopup(false);
            }
          }
        }, 300000); // 5 minutes timeout
      } else {
        await setDoc(doc(db, 'users', user.uid), { name: user.displayName, email: user.email, registeredAt: new Date() });
        console.log('Google user data saved to Firestore:', { name: user.displayName, email: user.email }); // Debug log
        navigate('/dashboard');
        console.log('Navigated to /dashboard (Google)'); // Debug log
      }
    } catch (err) {
      console.error('Error in handleGoogleRegister:', err); // Debug log
      setError(err.message);
      isRegistrationActive.current = false;
    }
  };

  const handleClosePopup = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // Stop polling immediately
      intervalRef.current = null;
    }
    setShowVerificationPopup(false);
    isRegistrationActive.current = false; // Mark registration as inactive
    await cleanupUser(); // Clean up user and sign out
  };

  // Handle page unload (e.g., back button, close tab)
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (isRegistrationActive.current && userRef.current) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome to show confirmation
        await cleanupUser(); // Delete user and sign out on page leave
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current && isRegistrationActive.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (userRef.current) {
          cleanupUser();
        }
      }
    };
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleEmailRegister}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="auth-button">Register with Email</button>
        </form>
        <button onClick={handleGoogleRegister} className="google-button">Register with Google</button>
        {error && <p className="error">{error}</p>}
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      {showVerificationPopup && (
        <div className="confirm-popup">
          <div className="confirm-popup-content">
            <h2>Email Verification Required</h2>
            <p>We have sent a verification email to {email}. Please verify your email to continue.</p>
            <p>Waiting for verification... (This popup will close automatically once verified)</p>
            <div className="confirm-buttons">
              <button onClick={handleClosePopup} className="cancel-button">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}