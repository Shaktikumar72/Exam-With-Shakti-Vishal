import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../firebase/firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName || 'Anonymous',
        email: result.user.email,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    try {
      // Clean the input: remove non-digits
      const cleanedPhone = phone.replace(/\D/g, '');
      // Validate: ensure it’s 10 digits
      if (cleanedPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }
      // Prepend +91 for India
      const formattedPhone = `+91${cleanedPhone}`;

      console.log('Auth object:', auth);
      console.log('Initializing RecaptchaVerifier...');
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        },
      });
      console.log('RecaptchaVerifier initialized:', recaptchaVerifier);

      console.log('Sending OTP to:', formattedPhone);
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setVerificationId(result.verificationId);
      console.log('OTP sent, verificationId:', result.verificationId);
      alert('OTP sent to your phone!');
    } catch (err) {
      console.error('Phone login error:', err);
      setError(err.message);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      console.log('Verifying OTP:', otp);
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const result = await auth.signInWithCredential(credential);
      console.log('Phone UID:', result.user.uid);
      await setDoc(doc(db, 'users', result.user.uid), {
        name: 'Anonymous',
        phone: result.user.phoneNumber,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
      setError('');
      setShowForgotPassword(false);
    } catch (err) {
      setError(err.message);
      setSuccessMessage('');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={showForgotPassword ? handleForgotPassword : handleEmailLogin}>
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
          {!showForgotPassword && (
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
          )}
          {showForgotPassword ? (
            <>
              <button type="submit" className="auth-button">Send Reset Email</button>
              <p className="auth-link">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Login
                </button>
              </p>
            </>
          ) : (
            <>
              <button type="submit" className="auth-button">Login with Email</button>
              <p className="auth-link">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  Forgot Password?
                </button>
              </p>
            </>
          )}
        </form>

        <button onClick={handleGoogleLogin} className="google-button">Login with Google</button>

        <form onSubmit={verificationId ? verifyOtp : handlePhoneLogin}>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9112345678"
              disabled={verificationId}
              maxLength="10" // Limit to 10 digits
            />
          </div>
          {verificationId && (
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
              />
            </div>
          )}
          <button type="submit" className="phone-button">
            {verificationId ? 'Verify OTP' : 'Send OTP'}
          </button>
        </form>
        <div id="recaptcha-container"></div>

        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}