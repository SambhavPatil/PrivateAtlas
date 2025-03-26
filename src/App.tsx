// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
// import { Icon } from 'leaflet';
// import { Building2, ParkingMeter as Parking, DoorOpen, MapPin, X, Navigation } from 'lucide-react';
// import * as turf from '@turf/turf';
// import { MapControls } from './components/MapControls';
// import { LandmarkForm } from './components/LandmarkForm';
// import { RouteForm } from './components/RouteForm';
// import { NavigationForm } from './components/NavigationForm';
// import { MapState, Landmark, Route } from './types/map';
// import 'leaflet/dist/leaflet.css';

// const DEFAULT_CENTER: [number, number] = [51.505, -0.09];
// const DEFAULT_ZOOM = 17;

// const MapEvents: React.FC<{
//   onMapClick: (latlng: [number, number]) => void;
// }> = ({ onMapClick }) => {
//   useMapEvents({
//     click: (e) => {
//       onMapClick([e.latlng.lat, e.latlng.lng]);
//     },
//   });
//   return null;
// };

// function App() {
//   const [mapState, setMapState] = useState<MapState>({
//     center: DEFAULT_CENTER,
//     zoom: DEFAULT_ZOOM,
//     landmarks: [],
//     routes: [],
//     mapType: 'terrain',
//   });

//   const [addingLandmark, setAddingLandmark] = useState(false);
//   const [addingRoute, setAddingRoute] = useState<'vehicle' | 'walking' | null>(null);
//   const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
//   const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
//   const [showNavigation, setShowNavigation] = useState(false);
//   const [navigationRoute, setNavigationRoute] = useState<Route | null>(null);

//   const handleMapClick = (latlng: [number, number]) => {
//     if (addingLandmark) {
//       setSelectedPosition(latlng);
//     } else if (addingRoute) {
//       setRoutePoints((prev) => [...prev, latlng]);
//     }
//   };

//   const handleAddLandmark = (landmarkData: Omit<Landmark, 'id'>) => {
//     const newLandmark: Landmark = {
//       ...landmarkData,
//       id: Date.now().toString(),
//     };
//     setMapState((prev) => ({
//       ...prev,
//       landmarks: [...prev.landmarks, newLandmark],
//     }));
//     setAddingLandmark(false);
//     setSelectedPosition(null);
//   };

//   const handleAddRoute = (routeName: string) => {
//     if (routePoints.length < 2) return;

//     const newRoute: Route = {
//       id: Date.now().toString(),
//       name: routeName,
//       type: addingRoute!,
//       coordinates: routePoints,
//     };

//     setMapState((prev) => ({
//       ...prev,
//       routes: [...prev.routes, newRoute],
//     }));
//     setAddingRoute(null);
//     setRoutePoints([]);
//   };

//   const cancelRouteCreation = () => {
//     setAddingRoute(null);
//     setRoutePoints([]);
//   };

//   const findBestPath = (
//     start: [number, number],
//     end: [number, number],
//     routes: Route[]
//   ): [number, number][] => {
//     // Convert start and end points to GeoJSON
//     const startPoint = turf.point(start);
//     const endPoint = turf.point(end);

//     // Create a network of all routes
//     const network = routes.reduce<[number, number][]>((acc, route) => {
//       return [...acc, ...route.coordinates];
//     }, []);

//     // Find nearest points on the network for start and end
//     const nearestStart = routes.reduce<{ point: [number, number]; distance: number } | null>(
//       (acc, route) => {
//         const line = turf.lineString(route.coordinates);
//         const nearest = turf.nearestPointOnLine(line, startPoint);
//         const distance = nearest.properties.dist || Infinity;

//         if (!acc || distance < acc.distance) {
//           return {
//             point: [nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]],
//             distance,
//           };
//         }
//         return acc;
//       },
//       null
//     );

//     const nearestEnd = routes.reduce<{ point: [number, number]; distance: number } | null>(
//       (acc, route) => {
//         const line = turf.lineString(route.coordinates);
//         const nearest = turf.nearestPointOnLine(line, endPoint);
//         const distance = nearest.properties.dist || Infinity;

//         if (!acc || distance < acc.distance) {
//           return {
//             point: [nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]],
//             distance,
//           };
//         }
//         return acc;
//       },
//       null
//     );

//     if (!nearestStart || !nearestEnd) {
//       return [start, end];
//     }

//     // Find connecting route segments
//     const connectingSegments = routes.reduce<[number, number][]>((acc, route) => {
//       const lineString = turf.lineString(route.coordinates);
//       const sliced = turf.lineSlice(
//         turf.point([nearestStart.point[1], nearestStart.point[0]]),
//         turf.point([nearestEnd.point[1], nearestEnd.point[0]]),
//         lineString
//       );

//       if (sliced.geometry.coordinates.length > 0) {
//         return [
//           ...acc,
//           ...sliced.geometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number]),
//         ];
//       }
//       return acc;
//     }, []);

//     // Construct the final path
//     return [
//       start,
//       nearestStart.point,
//       ...connectingSegments,
//       nearestEnd.point,
//       end,
//     ];
//   };

//   const handleNavigate = (startId: string, endId: string) => {
//     const startLandmark = mapState.landmarks.find((l) => l.id === startId);
//     const endLandmark = mapState.landmarks.find((l) => l.id === endId);

//     if (!startLandmark || !endLandmark) return;

//     const pathCoordinates = findBestPath(
//       startLandmark.position,
//       endLandmark.position,
//       mapState.routes
//     );

//     const navigationPath: Route = {
//       id: 'navigation',
//       name: `${startLandmark.name} to ${endLandmark.name}`,
//       type: 'walking',
//       coordinates: pathCoordinates,
//     };

//     setNavigationRoute(navigationPath);
//     setShowNavigation(false);
//   };

//   const getLandmarkIcon = (type: Landmark['type']) => {
//     switch (type) {
//       case 'building':
//         return <Building2 size={24} />;
//       case 'parking':
//         return <Parking size={24} />;
//       case 'entrance':
//         return <DoorOpen size={24} />;
//       default:
//         return <MapPin size={24} />;
//     }
//   };

//   return (
//     <div className="h-screen w-screen relative">
//       <MapContainer
//         center={mapState.center}
//         zoom={mapState.zoom}
//         className="h-full w-full"
//       >
//         <TileLayer
//           url={
//             mapState.mapType === 'terrain'
//               ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
//               : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
//           }
//         />
//         <MapEvents onMapClick={handleMapClick} />
        
//         {mapState.landmarks.map((landmark) => (
//           <Marker
//             key={landmark.id}
//             position={landmark.position}
//           >
//             <Popup>
//               <div>
//                 <h3 className="font-semibold">{landmark.name}</h3>
//                 {landmark.description && (
//                   <p className="text-sm text-gray-600">{landmark.description}</p>
//                 )}
//               </div>
//             </Popup>
//           </Marker>
//         ))}

//         {mapState.routes.map((route) => (
//           <Polyline
//             key={route.id}
//             positions={route.coordinates}
//             color={route.type === 'vehicle' ? '#3B82F6' : '#10B981'}
//             weight={3}
//           >
//             <Popup>
//               <div>
//                 <h3 className="font-semibold">{route.name}</h3>
//                 <p className="text-sm text-gray-600">
//                   {route.type === 'vehicle' ? 'Vehicle Route' : 'Walking Route'}
//                 </p>
//               </div>
//             </Popup>
//           </Polyline>
//         ))}

//         {routePoints.length > 0 && (
//           <Polyline
//             positions={routePoints}
//             color={addingRoute === 'vehicle' ? '#93C5FD' : '#6EE7B7'}
//             weight={3}
//             dashArray="5, 10"
//           />
//         )}

//         {navigationRoute && (
//           <Polyline
//             positions={navigationRoute.coordinates}
//             color="#F59E0B"
//             weight={4}
//             dashArray="10, 15"
//           >
//             <Popup>
//               <div>
//                 <h3 className="font-semibold">{navigationRoute.name}</h3>
//                 <p className="text-sm text-gray-600">Navigation Route</p>
//               </div>
//             </Popup>
//           </Polyline>
//         )}
//       </MapContainer>

//       <MapControls
//         mapType={mapState.mapType}
//         onToggleMapType={() =>
//           setMapState((prev) => ({
//             ...prev,
//             mapType: prev.mapType === 'terrain' ? 'satellite' : 'terrain',
//           }))
//         }
//         onAddLandmark={() => setAddingLandmark(true)}
//         onAddVehicleRoute={() => setAddingRoute('vehicle')}
//         onAddWalkingRoute={() => setAddingRoute('walking')}
//         onNavigate={() => setShowNavigation(true)}
//       />

//       {selectedPosition && addingLandmark && (
//         <LandmarkForm
//           position={selectedPosition}
//           onSubmit={handleAddLandmark}
//           onClose={() => {
//             setAddingLandmark(false);
//             setSelectedPosition(null);
//           }}
//         />
//       )}

//       {addingRoute && routePoints.length >= 2 && (
//         <RouteForm
//           type={addingRoute}
//           onSubmit={handleAddRoute}
//           onCancel={cancelRouteCreation}
//         />
//       )}

//       {addingRoute && (
//         <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
//           <div className="flex items-center justify-between mb-2">
//             <h3 className="font-semibold">
//               Adding {addingRoute === 'vehicle' ? 'Vehicle' : 'Walking'} Route
//             </h3>
//             <button
//               onClick={cancelRouteCreation}
//               className="text-gray-500 hover:text-gray-700"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//           <p className="text-sm text-gray-600">
//             Click on the map to add points to your route.
//             Add at least 2 points to complete the route.
//           </p>
//           <p className="text-sm text-gray-600 mt-1">
//             Points added: {routePoints.length}
//           </p>
//         </div>
//       )}

//       {showNavigation && (
//         <NavigationForm
//           landmarks={mapState.landmarks}
//           onNavigate={handleNavigate}
//           onClose={() => setShowNavigation(false)}
//         />
//       )}
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Building2, ParkingMeter as Parking, DoorOpen, MapPin, X, Navigation } from 'lucide-react';
import * as turf from '@turf/turf';
import { MapControls } from './components/MapControls';
import { LandmarkForm } from './components/LandmarkForm';
import { RouteForm } from './components/RouteForm';
import { NavigationForm } from './components/NavigationForm';
import { MapState, Landmark, Route } from './types/map';
import 'leaflet/dist/leaflet.css';

// Default location as fallback if geolocation fails
const DEFAULT_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 17;

// Component to recenter the map when user location is available
const LocationMarker: React.FC<{ setInitialLocation: (latlng: [number, number]) => void }> = ({ setInitialLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    map.locate({ setView: true });
    
    const onLocationFound = (e: any) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setInitialLocation(latlng);
      map.setView(latlng, DEFAULT_ZOOM);
    };
    
    const onLocationError = () => {
      console.log("Location access denied or unavailable");
    };
    
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
    };
  }, [map, setInitialLocation]);
  
  return null;
};

const MapEvents: React.FC<{
  onMapClick: (latlng: [number, number]) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

function App() {
  const [mapState, setMapState] = useState<MapState>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    landmarks: [],
    routes: [],
    mapType: 'terrain',
  });

  const [addingLandmark, setAddingLandmark] = useState(false);
  const [addingRoute, setAddingRoute] = useState<'vehicle' | 'walking' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState<Route | null>(null);
  const [locationInitialized, setLocationInitialized] = useState(false);

  // Function to set the initial location from geolocation
  const setInitialLocation = (latlng: [number, number]) => {
    if (!locationInitialized) {
      setMapState(prev => ({
        ...prev,
        center: latlng
      }));
      setLocationInitialized(true);
    }
  };

  const handleMapClick = (latlng: [number, number]) => {
    if (addingLandmark) {
      setSelectedPosition(latlng);
    } else if (addingRoute) {
      setRoutePoints((prev) => [...prev, latlng]);
    }
  };

  const handleAddLandmark = (landmarkData: Omit<Landmark, 'id'>) => {
    const newLandmark: Landmark = {
      ...landmarkData,
      id: Date.now().toString(),
    };
    setMapState((prev) => ({
      ...prev,
      landmarks: [...prev.landmarks, newLandmark],
    }));
    setAddingLandmark(false);
    setSelectedPosition(null);
  };

  const handleAddRoute = (routeName: string) => {
    if (routePoints.length < 2) return;

    const newRoute: Route = {
      id: Date.now().toString(),
      name: routeName,
      type: addingRoute!,
      coordinates: routePoints,
    };

    setMapState((prev) => ({
      ...prev,
      routes: [...prev.routes, newRoute],
    }));
    setAddingRoute(null);
    setRoutePoints([]);
  };

  const cancelRouteCreation = () => {
    setAddingRoute(null);
    setRoutePoints([]);
  };

  const findBestPath = (
    start: [number, number],
    end: [number, number],
    routes: Route[]
  ): [number, number][] => {
    // Convert start and end points to GeoJSON
    const startPoint = turf.point(start);
    const endPoint = turf.point(end);

    // Create a network of all routes
    const network = routes.reduce<[number, number][]>((acc, route) => {
      return [...acc, ...route.coordinates];
    }, []);

    // Find nearest points on the network for start and end
    const nearestStart = routes.reduce<{ point: [number, number]; distance: number } | null>(
      (acc, route) => {
        const line = turf.lineString(route.coordinates);
        const nearest = turf.nearestPointOnLine(line, startPoint);
        const distance = nearest.properties.dist || Infinity;

        if (!acc || distance < acc.distance) {
          return {
            point: [nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]],
            distance,
          };
        }
        return acc;
      },
      null
    );

    const nearestEnd = routes.reduce<{ point: [number, number]; distance: number } | null>(
      (acc, route) => {
        const line = turf.lineString(route.coordinates);
        const nearest = turf.nearestPointOnLine(line, endPoint);
        const distance = nearest.properties.dist || Infinity;

        if (!acc || distance < acc.distance) {
          return {
            point: [nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]],
            distance,
          };
        }
        return acc;
      },
      null
    );

    if (!nearestStart || !nearestEnd) {
      return [start, end];
    }

    // Find connecting route segments
    const connectingSegments = routes.reduce<[number, number][]>((acc, route) => {
      const lineString = turf.lineString(route.coordinates);
      const sliced = turf.lineSlice(
        turf.point([nearestStart.point[1], nearestStart.point[0]]),
        turf.point([nearestEnd.point[1], nearestEnd.point[0]]),
        lineString
      );

      if (sliced.geometry.coordinates.length > 0) {
        return [
          ...acc,
          ...sliced.geometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number]),
        ];
      }
      return acc;
    }, []);

    // Construct the final path
    return [
      start,
      nearestStart.point,
      ...connectingSegments,
      nearestEnd.point,
      end,
    ];
  };

  const handleNavigate = (startId: string, endId: string) => {
    const startLandmark = mapState.landmarks.find((l) => l.id === startId);
    const endLandmark = mapState.landmarks.find((l) => l.id === endId);

    if (!startLandmark || !endLandmark) return;

    const pathCoordinates = findBestPath(
      startLandmark.position,
      endLandmark.position,
      mapState.routes
    );

    const navigationPath: Route = {
      id: 'navigation',
      name: `${startLandmark.name} to ${endLandmark.name}`,
      type: 'walking',
      coordinates: pathCoordinates,
    };

    setNavigationRoute(navigationPath);
    setShowNavigation(false);
  };

  const getLandmarkIcon = (type: Landmark['type']) => {
    switch (type) {
      case 'building':
        return <Building2 size={24} />;
      case 'parking':
        return <Parking size={24} />;
      case 'entrance':
        return <DoorOpen size={24} />;
      default:
        return <MapPin size={24} />;
    }
  };

  return (
    <div className="h-screen w-screen relative">
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        className="h-full w-full"
      >
        <TileLayer
          url={
            mapState.mapType === 'terrain'
              ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          }
        />
        <LocationMarker setInitialLocation={setInitialLocation} />
        <MapEvents onMapClick={handleMapClick} />
        
        {mapState.landmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            position={landmark.position}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{landmark.name}</h3>
                {landmark.description && (
                  <p className="text-sm text-gray-600">{landmark.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {mapState.routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.coordinates}
            color={route.type === 'vehicle' ? '#3B82F6' : '#10B981'}
            weight={3}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{route.name}</h3>
                <p className="text-sm text-gray-600">
                  {route.type === 'vehicle' ? 'Vehicle Route' : 'Walking Route'}
                </p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color={addingRoute === 'vehicle' ? '#93C5FD' : '#6EE7B7'}
            weight={3}
            dashArray="5, 10"
          />
        )}

        {navigationRoute && (
          <Polyline
            positions={navigationRoute.coordinates}
            color="#F59E0B"
            weight={4}
            dashArray="10, 15"
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{navigationRoute.name}</h3>
                <p className="text-sm text-gray-600">Navigation Route</p>
              </div>
            </Popup>
          </Polyline>
        )}
      </MapContainer>

      <MapControls
        mapType={mapState.mapType}
        onToggleMapType={() =>
          setMapState((prev) => ({
            ...prev,
            mapType: prev.mapType === 'terrain' ? 'satellite' : 'terrain',
          }))
        }
        onAddLandmark={() => setAddingLandmark(true)}
        onAddVehicleRoute={() => setAddingRoute('vehicle')}
        onAddWalkingRoute={() => setAddingRoute('walking')}
        onNavigate={() => setShowNavigation(true)}
      />

      {selectedPosition && addingLandmark && (
        <LandmarkForm
          position={selectedPosition}
          onSubmit={handleAddLandmark}
          onClose={() => {
            setAddingLandmark(false);
            setSelectedPosition(null);
          }}
        />
      )}

      {addingRoute && routePoints.length >= 2 && (
        <RouteForm
          type={addingRoute}
          onSubmit={handleAddRoute}
          onCancel={cancelRouteCreation}
        />
      )}

      {addingRoute && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              Adding {addingRoute === 'vehicle' ? 'Vehicle' : 'Walking'} Route
            </h3>
            <button
              onClick={cancelRouteCreation}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Click on the map to add points to your route.
            Add at least 2 points to complete the route.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Points added: {routePoints.length}
          </p>
        </div>
      )}

      {showNavigation && (
        <NavigationForm
          landmarks={mapState.landmarks}
          onNavigate={handleNavigate}
          onClose={() => setShowNavigation(false)}
        />
      )}
    </div>
  );
}

export default App;