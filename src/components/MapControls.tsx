import React from 'react';
import { Layers, Navigation, MapPin, Car, Scaling as Walking } from 'lucide-react';

interface MapControlsProps {
  onToggleMapType: () => void;
  onAddLandmark: () => void;
  onAddVehicleRoute: () => void;
  onAddWalkingRoute: () => void;
  onNavigate: () => void;
  mapType: 'terrain' | 'satellite';
}

export const MapControls: React.FC<MapControlsProps> = ({
  onToggleMapType,
  onAddLandmark,
  onAddVehicleRoute,
  onAddWalkingRoute,
  onNavigate,
  mapType,
}) => {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-[1000]">
      <button
        onClick={onToggleMapType}
        className="flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-lg hover:bg-gray-100"
        title={`Switch to ${mapType === 'terrain' ? 'satellite' : 'terrain'} view`}
      >
        <Layers className="w-6 h-6" />
      </button>
      <button
        onClick={onAddLandmark}
        className="flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-lg hover:bg-gray-100"
        title="Add landmark"
      >
        <MapPin className="w-6 h-6" />
      </button>
      <button
        onClick={onAddVehicleRoute}
        className="flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-lg hover:bg-gray-100"
        title="Add vehicle route"
      >
        <Car className="w-6 h-6" />
      </button>
      <button
        onClick={onAddWalkingRoute}
        className="flex items-center justify-center w-10 h-10 mb-2 bg-white rounded-lg hover:bg-gray-100"
        title="Add walking route"
      >
        <Walking className="w-6 h-6" />
      </button>
      <button
        onClick={onNavigate}
        className="flex items-center justify-center w-10 h-10 bg-white rounded-lg hover:bg-gray-100"
        title="Navigate between points"
      >
        <Navigation className="w-6 h-6" />
      </button>
    </div>
  );
};