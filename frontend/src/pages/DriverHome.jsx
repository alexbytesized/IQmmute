import React, { useState } from 'react';
import DriverNavbar from '../components/DriverNavbar';
import MapComponent from '../components/MapComponent';

const DriverHome = () => {
  const [userLocation] = useState(null);

  return (
    <div className="home-page">
      <DriverNavbar />
      <main className="main-content">
        <MapComponent userLocation={userLocation} />
      </main>
    </div>
  );
};

export default DriverHome;