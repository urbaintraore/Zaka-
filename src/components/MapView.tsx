import React from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Establishment } from '../types';

interface MapViewProps {
  establishments: Establishment[];
  onEstClick: (id: string) => void;
}

export function MapView({ establishments, onEstClick }: MapViewProps) {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-md">
        <Map
          defaultCenter={{ lat: 12.3714, lng: -1.5197 }}
          defaultZoom={13}
        >
          {establishments.map(est => {
            const [lat, lng] = est.geolocation ? est.geolocation.split(',').map(Number) : [0, 0];
            return (
              <Marker
                key={est.id}
                position={{ lat, lng }}
                onClick={() => onEstClick(est.id)}
              />
            );
          })}
        </Map>
      </div>
    </APIProvider>
  );
}
