import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jeepneyImg from '../assets/images/jeepney.png';

const SignIn = () => {
  // 1. State to hold user credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => {
      document.body.classList.remove('auth-body');
    };
  }, []);

  // 2. Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // 3. Input Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    const credentials = { email, password };

    try {
      // 4. Send data to Backend
      const response = await fetch('http://localhost:8000/auth/driver/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful', data);
        
        // Store user info
        localStorage.setItem('driver_id', data.driver_id);
        localStorage.setItem('driver_name', `${data.first_name} ${data.last_name}`);
        localStorage.setItem('driver_email', data.email);

        navigate('/driver/home');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Network error. Unable to connect to server.'); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="illustration-container">
        <img src={jeepneyImg} alt="Jeepney Illustration" className="jeepney-image" />
      </div>
      
      <h1 className="app-title">IQmmute</h1>
      <p>Sign in to your IQmmute Driver Account.</p>
      
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {error && <div className="error-message">{error}</div>}
        
        <div>
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
        <Link to="/signup">
          Don't have an account? Sign Up
        </Link>
        <Link to="/" style={{ marginTop: '0.5rem' }}>
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default SignIn;
