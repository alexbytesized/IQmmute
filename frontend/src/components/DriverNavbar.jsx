import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/IQmmuteLogo.svg';

const DriverNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('driver_id');
    localStorage.removeItem('driver_name');
    localStorage.removeItem('driver_email');
    navigate('/signin');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/driver/home">
          <img src={logo} alt="IQmmute Logo" className="navbar-logo" />
        </Link>
      </div>
      <div className="navbar-right">
        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default DriverNavbar;
