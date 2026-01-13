import React from 'react';
import { MapPin, Flag, ChevronsDown } from 'lucide-react';

const LocationInputPanel = ({ originAddress, setOriginAddress, onUseCurrentLocation }) => {
  return (
    <div className="panel-container">
      <button 
        className="gps-fab" 
        onClick={onUseCurrentLocation}
      >
        <MapPin size={24} />
      </button>

      <div className="location-panel">
        <div className="panel-handle"></div>
        
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Origin" 
            className="location-input"
            value={originAddress}
            onChange={setOriginAddress}
          />
          <div className="input-icon-wrapper">
            <MapPin className="input-icon-static" size={20} />
          </div>
        </div>

        <div className="connector">
          <ChevronsDown color="white" size={24} />
        </div>

        <div className="input-group">
          <input type="text" placeholder="Destination" className="location-input" />
          <div className="input-icon-wrapper">
            <Flag className="input-icon-static" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationInputPanel;
