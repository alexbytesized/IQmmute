import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/IQmmuteLogo.svg';
import { User, AlertTriangle, ClipboardList, CircleUserRound } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home">
          <img src={logo} alt="IQmmute Logo" className="navbar-logo" />
        </Link>
      </div>
      <div className="navbar-right">
        <button className="icon-btn" aria-label="Report">
          <ClipboardList color="white" size={24} />
        </button>
        <button className="icon-btn" aria-label="User Profile">
          <CircleUserRound color="white" size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
