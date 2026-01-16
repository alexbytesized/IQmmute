import React, { useState, useEffect, useRef } from 'react';
import { Hash, BusFront, ChevronsDown } from 'lucide-react';

const DriverRoutePanel = ({
  routeId,
  setRouteId,
  routeName,
  setRouteName,
  allRoutes = [],
  onRouteSelect
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'id' or 'name'
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filterRoutes = (field, value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }
    
    const lowerVal = value.toLowerCase();
    const filtered = allRoutes.filter(route => {
      if (field === 'id') {
        return route.route_code.toLowerCase().includes(lowerVal);
      } else {
        return route.route_name.toLowerCase().includes(lowerVal);
      }
    });
    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    setShowSuggestions(true);
  };

  const handleIdChange = (e) => {
    const val = e.target.value;
    setRouteId(e); // Pass the event up
    setActiveField('id');
    filterRoutes('id', val);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setRouteName(e); // Pass the event up
    setActiveField('name');
    filterRoutes('name', val);
  };

  const handleSuggestionClick = (route) => {
    onRouteSelect(route);
    setShowSuggestions(false);
  };

  return (
    <div className="panel-container" ref={wrapperRef}>

      <div className="location-panel" style={{ position: 'relative' }}>
        <div className="panel-handle"></div>
        
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Route Code" 
            className="location-input"
            value={routeId}
            onChange={handleIdChange}
            onFocus={() => { setActiveField('id'); if(routeId) filterRoutes('id', routeId); }}
            autoComplete="off"
            aria-label="Route ID input"
          />
          <div className="input-icon-wrapper">
            <Hash className="input-icon-static" size={20} />
          </div>
        </div>

        <div className="connector">
          <ChevronsDown color="white" size={24} />
        </div>

        <div className="input-group">
          <input 
            type="text" 
            placeholder="Route Name" 
            className="location-input"
            value={routeName}
            onChange={handleNameChange}
            onFocus={() => { setActiveField('name'); if(routeName) filterRoutes('name', routeName); }}
            autoComplete="off"
            aria-label="Route Name input"
          />
          <div className="input-icon-wrapper">
            <BusFront className="input-icon-static" size={20} />
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((route) => (
              <li key={route.id} onClick={() => handleSuggestionClick(route)}>
                <strong>{route.route_code}</strong> - {route.route_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DriverRoutePanel;
