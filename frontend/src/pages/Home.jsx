import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import LocationInputPanel from '../components/LocationInputPanel';
import useDebounce from '../hooks/useDebounce';

const Home = () => {
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [originAddress, setOriginAddress] = useState('');
  
  // Debounce the address input: wait 1000ms (1 second) after user stops typing
  const debouncedAddress = useDebounce(originAddress, 1000);
  const [isTyping, setIsTyping] = useState(false); // To prevent geocoding loop

  // --- 1. Forward Geocoding (Address -> Coordinates) ---
  useEffect(() => {
    // Only search if we have a substantial string and user wasn't just "set" by GPS
    if (debouncedAddress && debouncedAddress.length > 3 && isTyping) {
      const fetchCoordinates = async () => {
        try {
          console.log("Searching for:", debouncedAddress);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}&viewbox=120.85,14.78,121.15,14.33&bounded=1`
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            // Update map location, but DO NOT update originAddress (to avoid cursor jump or overwrite)
            setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
          }
        } catch (error) {
          console.error("Error finding location:", error);
        } finally {
            setIsTyping(false); // Reset typing flag
        }
      };

      fetchCoordinates();
    }
  }, [debouncedAddress]); // Trigger when the delayed value changes

  // --- 2. Reverse Geocoding (GPS -> Address) ---
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    // Reset typing flag so this update doesn't trigger a re-search
    setIsTyping(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);

        // Reverse Geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setOriginAddress(data.display_name);
          } else {
            setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check your permissions.");
      }
    );
  };

  // Handle manual typing
  const handleAddressChange = (e) => {
    setOriginAddress(e.target.value);
    setIsTyping(true); // Mark that this change came from user typing
  };

  return (
    <div className="home-page">
      <Navbar />
      <main className="main-content">
        <MapComponent userLocation={userLocation} />
        <LocationInputPanel 
          originAddress={originAddress} 
          setOriginAddress={handleAddressChange} // Use our new handler
          onUseCurrentLocation={handleUseCurrentLocation} 
        />
      </main>
    </div>
  );
};

export default Home;