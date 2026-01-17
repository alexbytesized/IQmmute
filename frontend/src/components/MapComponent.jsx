import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to move the map
const RecenterMap = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [location, map]);
  return null;
};

// Helper to fit bounds to the route
const FitRouteBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

const MapComponent = ({ userLocation, routeGeometry }) => {
  // Metro Manila coordinates
  const position = [14.5995, 120.9842];
  
  // Define bounds for Metro Manila [Southwest, Northeast]
  const bounds = [
    [14.33, 120.85], // Southwest corner
    [14.78, 121.15]  // Northeast corner
  ];

  // Process GeoJSON geometry into Leaflet Polyline positions [lat, lng]
  let routePositions = [];
  if (routeGeometry && routeGeometry.type === 'LineString') {
    routePositions = routeGeometry.coordinates.map(coord => [coord[1], coord[0]]);
  } else if (routeGeometry && routeGeometry.type === 'MultiLineString') {
    // Flatten MultiLineString for simplicity, or just take the first/longest segment
    // Here we just take all segments and join them visually
     routePositions = routeGeometry.coordinates.flat().map(coord => [coord[1], coord[0]]);
  }

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={position} 
        zoom={12} 
        minZoom={11}
        maxZoom={18}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        style={{ height: 'calc(100vh - 60px)', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {userLocation && (
          <>
            <RecenterMap location={userLocation} />
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          </>
        )}

        {routePositions.length > 0 && (
          <>
            <Polyline positions={routePositions} pathOptions={{ color: 'blue', weight: 5, opacity: 0.7 }} />
            <FitRouteBounds positions={routePositions} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
