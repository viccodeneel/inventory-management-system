import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './forget.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      if (email) {
        setIsSubmitted(true);
        setIsLoading(false);
      } else {
        setError('Please enter a valid email address');
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleBackToLogin = () => {
    navigate('/'); // Navigate to login page using React Router
  };

  // Warning icon for error messages
  const WarningIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#DC2626"/>
    </svg>
  );

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        
        <div className="icon-container">
          <div className="icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6V10.5C4 15.5 7.5 20 12 21C16.5 20 20 15.5 20 10.5V6L12 2Z" fill="currentColor" />
            </svg>
          </div>
        </div>
        
        <h1>Soko Aerial Robotics</h1>
        
        {error && (
          <div className="error-message">
            <WarningIcon />
            {error}
          </div>
        )}
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="form-container">
            <h2 className="form-title">Reset Password</h2>
            <p className="form-description">Enter your administrator/personel email to receive a password reset link</p>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="admin.email@sokorobotics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'input-error' : ''}
              />
            </div>
            
            <button 
              type="submit" 
              className="signin-button admin-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="back-login">
              <button type="button" className="back-link" onClick={handleBackToLogin}>
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Reset Link Sent</h2>
            <p>If an account exists with that email, you will receive a password reset link shortly.</p>
            <button className="signin-button admin-button" onClick={handleBackToLogin}>
              Return to Login
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ForgotPassword;