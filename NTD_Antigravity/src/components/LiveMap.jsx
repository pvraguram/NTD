import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when location changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LiveMap({ location, safeZoneRadius }) {
  if (!location || !location.lat || !location.lng) {
    return (
      <div className="map-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
        <div className="pulse-animation" style={{ width: '40px', height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '50%', marginBottom: '1rem' }}></div>
        <h3 style={{ margin: 0 }}>Waiting for GPS Signal...</h3>
        <p style={{ fontSize: '0.875rem' }}>The map will appear once the device sends its location.</p>
      </div>
    );
  }

  const center = [location.lat, location.lng];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minHeight: '400px' }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ flex: 1, width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={center}>
          <Popup>
            User's Current Location
            <br />
            Last updated: {new Date(location.lastUpdated).toLocaleTimeString()}
          </Popup>
        </Marker>
        
        {Number(safeZoneRadius) > 0 && (
          <Circle
            center={center}
            radius={Number(safeZoneRadius)}
            pathOptions={{ color: 'var(--success-color)', fillColor: 'var(--success-color)', fillOpacity: 0.1 }}
          />
        )}
        <MapUpdater center={location} />
        <MapResizer />
      </MapContainer>
    </div>
  );
}
