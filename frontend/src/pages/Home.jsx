import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import LocationInputPanel from '../components/LocationInputPanel';
import useDebounce from '../hooks/useDebounce';

const Home = () => {
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [originAddress, setOriginAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationLatLng, setDestinationLatLng] = useState(null);
  
  const debouncedAddress = useDebounce(originAddress, 1000);
  const debouncedDestination = useDebounce(destination, 1000);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (debouncedAddress && debouncedAddress.length > 3 && isTyping) {
      const fetchCoordinates = async () => {
        try {
          console.log("Searching for origin:", debouncedAddress);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}&viewbox=120.85,14.78,121.15,14.33&bounded=1`
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            console.log("Origin Coords:", { lat: parseFloat(lat), lng: parseFloat(lon) });
            setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
          }
        } catch (error) {
          console.error("Error finding origin location:", error);
        } finally {
            setIsTyping(false);
        }
      };

      fetchCoordinates();
    }
  }, [debouncedAddress]);

  useEffect(() => {
    if (debouncedDestination && debouncedDestination.length > 3) {
      const fetchCoordinates = async () => {
        try {
          console.log("Searching for destination:", debouncedDestination);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedDestination)}&viewbox=120.85,14.78,121.15,14.33&bounded=1`
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            console.log("Destination Coords:", { lat: parseFloat(lat), lng: parseFloat(lon) });
            setDestinationLatLng({ lat: parseFloat(lat), lng: parseFloat(lon) });
          } else {
            setDestinationLatLng(null);
          }
        } catch (error) {
          console.error("Error finding destination location:", error);
          setDestinationLatLng(null);
        }
      };

      fetchCoordinates();
    } else if (!debouncedDestination) {
      setDestinationLatLng(null);
    }
  }, [debouncedDestination]);

  const handleUseCurrentLocation = () => {
    console.log("Attempting to use current location...");
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsTyping(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Current Location Coords:", { lat: latitude, lng: longitude });
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);

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
          console.error("Error fetching address for current location:", error);
          setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check your permissions.");
      }
    );
  };

  const handleAddressChange = (e) => {
    setOriginAddress(e.target.value);
    setIsTyping(true);
  };

  const handleDestinationChange = (e) => {
    setDestination(e.target.value);
  }

  return (
    <div className="home-page">
      <Navbar />
      <main className="main-content">
        <MapComponent userLocation={userLocation} />
        <LocationInputPanel 
          originAddress={originAddress} 
          setOriginAddress={handleAddressChange}
          onUseCurrentLocation={handleUseCurrentLocation}
          destination={destination}
          setDestination={handleDestinationChange}
        />
      </main>
    </div>
  );
};

export default Home;