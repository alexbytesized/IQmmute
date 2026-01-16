import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();
  
  // 1. State to hold all the user inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    licenseNumber: '',
    phoneNumber: '',
    plateNumber: '',
    operatorName: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => {
      document.body.classList.remove('auth-body');
    };
  }, []);

  // 2. Function to update state when user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // 3. Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Input Validation
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^\d{11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameRegex.test(formData.firstName)) {
      setError("First name must contain only letters.");
      return;
    }
    if (!nameRegex.test(formData.lastName)) {
      setError("Last name must contain only letters.");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Phone number must be exactly 11 digits.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // 4. Send data to Backend
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          licenseNumber: formData.licenseNumber,
          phoneNumber: formData.phoneNumber,
          plateNumber: formData.plateNumber,
          operatorName: formData.operatorName,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully!');
        navigate('/');
      } else {
        setError(data.message || 'Failed to create account.');
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError('Network error. Unable to reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="app-title">Sign Up</h1>
      <p>Create your IQmmute Driver Account.</p>
      
      <form style={{ width: '100%' }} onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <input 
          type="text" 
          name="firstName"
          placeholder="First Name" 
          className="input-field" 
          value={formData.firstName}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="text" 
          name="lastName"
          placeholder="Last Name" 
          className="input-field" 
          value={formData.lastName}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="email" 
          name="email"
          placeholder="Email" 
          className="input-field" 
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="tel" 
          name="phoneNumber"
          placeholder="Phone Number" 
          className="input-field" 
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          maxLength="11"
          pattern="\d{11}"
          title="Phone number must be 11 digits."
          disabled={isLoading}
        />
        <input 
          type="text" 
          name="licenseNumber"
          placeholder="License Number" 
          className="input-field" 
          value={formData.licenseNumber}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="text" 
          name="plateNumber"
          placeholder="Plate Number" 
          className="input-field" 
          value={formData.plateNumber}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="text" 
          name="operatorName"
          placeholder="Operator Name" 
          className="input-field" 
          value={formData.operatorName}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="password" 
          name="password"
          placeholder="Password" 
          className="input-field" 
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        <input 
          type="password" 
          name="confirmPassword"
          placeholder="Confirm Password" 
          className="input-field" 
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <Link to="/signin">
        Already have an account? Sign In
      </Link>
    </div>
  );
};

export default SignUp;
