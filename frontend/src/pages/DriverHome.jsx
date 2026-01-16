import React, { useState, useEffect } from 'react';
import DriverNavbar from '../components/DriverNavbar';
import MapComponent from '../components/MapComponent';
import DriverRoutePanel from '../components/DriverRoutePanel';

const DriverHome = () => {
  const [userLocation] = useState(null);
  const [routeId, setRouteId] = useState('');
  const [routeName, setRouteName] = useState('');
  const [allRoutes, setAllRoutes] = useState([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('http://localhost:8000/routes');
        if (response.ok) {
          const data = await response.json();
          setAllRoutes(data);
        } else {
          console.error("Failed to fetch routes");
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };
    fetchRoutes();
  }, []);

  const handleRouteSelect = (route) => {
    setRouteId(route.route_code);
    setRouteName(route.route_name);
  };

  return (
    <div className="home-page">
      <DriverNavbar />
      <main className="main-content">
        <MapComponent userLocation={userLocation} />
        <DriverRoutePanel 
          routeId={routeId}
          setRouteId={(e) => setRouteId(e.target.value)}
          routeName={routeName}
          setRouteName={(e) => setRouteName(e.target.value)}
          allRoutes={allRoutes}
          onRouteSelect={handleRouteSelect}
        />
      </main>
    </div>
  );
};

export default DriverHome;