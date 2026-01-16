import React, { useState, useEffect } from 'react';
import DriverNavbar from '../components/DriverNavbar';
import MapComponent from '../components/MapComponent';
import DriverRoutePanel from '../components/DriverRoutePanel';

const DriverHome = () => {
  const [userLocation] = useState(null);
  const [routeId, setRouteId] = useState('');
  const [routeName, setRouteName] = useState('');
  const [allRoutes, setAllRoutes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState(null);

  // Helper to fetch geometry
  const fetchGeometry = async (code) => {
    try {
      const response = await fetch(`http://localhost:8000/routes/${code}/geometry`);
      if (response.ok) {
        const geoData = await response.json();
        setRouteGeometry(geoData);
      } else {
        console.warn("No geometry found for route:", code);
        setRouteGeometry(null);
      }
    } catch (error) {
      console.error("Error fetching geometry:", error);
      setRouteGeometry(null);
    }
  };

  // 1. Fetch all routes and current assignment
  useEffect(() => {
    const driverId = localStorage.getItem('driver_id');
    
    const fetchData = async () => {
      try {
        // Fetch all available routes
        const routesRes = await fetch('http://localhost:8000/routes');
        if (routesRes.ok) {
          const routesData = await routesRes.json();
          setAllRoutes(routesData);
        }

        // Fetch current assignment for this driver
        const assignRes = await fetch(`http://localhost:8000/driver-routes/${driverId}`);
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          if (assignData.assigned) {
            setRouteId(assignData.route_code);
            setRouteName(assignData.route_name);
            // Load geometry for pre-assigned route
            fetchGeometry(assignData.route_code);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    if (driverId) fetchData();
  }, []);

  // 2. Handle new route selection
  const handleRouteSelect = async (route) => {
    const driverId = localStorage.getItem('driver_id');
    setRouteId(route.route_code);
    setRouteName(route.route_name);
    
    // Optimistically load geometry immediately for better UX
    fetchGeometry(route.route_code);

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/driver-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: parseInt(driverId),
          route_code: route.route_code
        })
      });
      
      if (response.ok) {
        console.log("Route assigned successfully");
      } else {
        alert("Failed to save route assignment.");
      }
    } catch (error) {
      console.error("Assignment error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="home-page">
      <DriverNavbar />
      <main className="main-content">
        <MapComponent userLocation={userLocation} routeGeometry={routeGeometry} />
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