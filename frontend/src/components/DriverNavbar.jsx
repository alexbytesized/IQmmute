import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/IQmmuteLogo.svg';

const DriverNavbar = () => {
  const handleLogout = () => {
    // Temporarily removed navigation for debugging.
    console.log("User clicked Log Out.");
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
