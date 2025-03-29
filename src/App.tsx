import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Building2, ParkingMeter as Parking, DoorOpen, MapPin, X, Navigation } from 'lucide-react';
import * as turf from '@turf/turf';
import { MapControls } from './components/MapControls';
import { LandmarkForm } from './components/LandmarkForm';
import { RouteForm } from './components/RouteForm';
import { NavigationForm } from './components/NavigationForm';
import { MapState, Landmark, Route, NavigationRoute } from './types/map';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 17;

// Create custom icons for landmarks
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill="${color}"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const LANDMARK_ICONS = {
  building: createCustomIcon('#3B82F6'),
  parking: createCustomIcon('#10B981'),
  entrance: createCustomIcon('#F59E0B'),
  other: createCustomIcon('#6B7280'),
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
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickPosition, setLastClickPosition] = useState<[number, number] | null>(null);

  const handleMapClick = (latlng: [number, number]) => {
    if (addingLandmark) {
      setSelectedPosition(latlng);
    } else if (addingRoute) {
      const currentTime = Date.now();
      const isSamePosition = lastClickPosition && 
        Math.abs(latlng[0] - lastClickPosition[0]) < 0.0001 && 
        Math.abs(latlng[1] - lastClickPosition[1]) < 0.0001;
      
      if (isSamePosition && currentTime - lastClickTime < 500) {
        // Double click detected
        if (routePoints.length > 0) {
          setShowRouteForm(true);
        }
      } else {
        // Single click
        setRoutePoints([...routePoints, latlng]);
      }
      
      setLastClickTime(currentTime);
      setLastClickPosition(latlng);
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
    if (routePoints.length < 1) return;

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
    setShowRouteForm(false);
    setLastClickTime(0);
    setLastClickPosition(null);
  };

  const cancelRouteCreation = () => {
    setAddingRoute(null);
    setRoutePoints([]);
    setShowRouteForm(false);
    setLastClickTime(0);
    setLastClickPosition(null);
  };

  const calculateDistance = (coords: [number, number][]): number => {
    if (coords.length < 2) return 0;
    
    const line = turf.lineString(coords.map(coord => [coord[1], coord[0]]));
    const length = turf.length(line, { units: 'kilometers' });
    return length;
  };

  
  const findBestPath = (
    start: [number, number],
    end: [number, number],
    routes: Route[]
  ): NavigationRoute => {
    if (routes.length === 0) {
      const directPath = [start, end];
      const distance = calculateDistance(directPath);
      return {
        id: 'navigation',
        name: 'Direct Route',
        type: 'walking',
        coordinates: directPath,
        distance,
        segments: [{
          coordinates: directPath,
          distance,
          description: `Direct path (${distance.toFixed(2)} km)`
        }]
      };
    }
  
    // Convert coordinates to GeoJSON format for turf operations
    const startPoint = turf.point([start[1], start[0]]);
    const endPoint = turf.point([end[1], end[0]]);
    
    // Define search radius in kilometers (10 meters = 0.01 km)
    const searchRadius = 0.01;
  
    // Find all possible route candidates
    const routeSegments = routes.map(route => {
      // Convert route to GeoJSON format
      const routeGeoJSON = turf.lineString(route.coordinates.map(coord => [coord[1], coord[0]]));
      
      // Find nearest points on route
      const nearestToStart = turf.nearestPointOnLine(routeGeoJSON, startPoint);
      const nearestToEnd = turf.nearestPointOnLine(routeGeoJSON, endPoint);
      
      // Get distances
      const startDist = nearestToStart.properties.dist || Infinity;
      const endDist = nearestToEnd.properties.dist || Infinity;
      
      // Convert nearest points back to [lat, lng] format
      const startNearestPoint: [number, number] = [
        nearestToStart.geometry.coordinates[1], 
        nearestToStart.geometry.coordinates[0]
      ];
      const endNearestPoint: [number, number] = [
        nearestToEnd.geometry.coordinates[1], 
        nearestToEnd.geometry.coordinates[0]
      ];
      
      // Get location index along the route
      const startIndex = nearestToStart.properties.index || 0;
      const endIndex = nearestToEnd.properties.index || 0;
      
      // Create the path that follows the route
      // Convert geometry to actual route coordinates
      let routePath: [number, number][] = [];
      
      // Find the actual coordinates along the route
      // We'll use a fundamentally different approach that ensures we follow the exact route
      
      // First, ensure we have the route in proper order
      let orderedRouteCoords = [...route.coordinates];
      let useReverseDirection = false;
      
      // Check if we need to traverse the route in reverse
      if (startIndex > endIndex) {
        orderedRouteCoords.reverse();
        useReverseDirection = true;
      }
      
      // Calculate distance of each point from start and end
      const pointDistances = orderedRouteCoords.map(coord => {
        const point = turf.point([coord[1], coord[0]]);
        const distFromStart = turf.distance(point, startPoint);
        const distFromEnd = turf.distance(point, endPoint);
        return { coord, distFromStart, distFromEnd };
      });
      
      // Sort by distance from start
      pointDistances.sort((a, b) => a.distFromStart - b.distFromStart);
      
      // Find the closest point to start
      const closestToStart = pointDistances[0];
      
      // Sort by distance from end
      pointDistances.sort((a, b) => a.distFromEnd - b.distFromEnd);
      
      // Find the closest point to end
      const closestToEnd = pointDistances[0];
      
      // Get the index of these points in the original array
      const startPointIndex = orderedRouteCoords.findIndex(
        coord => coord[0] === closestToStart.coord[0] && coord[1] === closestToStart.coord[1]
      );
      const endPointIndex = orderedRouteCoords.findIndex(
        coord => coord[0] === closestToEnd.coord[0] && coord[1] === closestToEnd.coord[1]
      );
      
      // Now extract the actual path through the route
      if (startPointIndex <= endPointIndex) {
        // Normal order
        routePath = [
          startNearestPoint,
          ...orderedRouteCoords.slice(startPointIndex + 1, endPointIndex),
          endNearestPoint
        ];
      } else {
        // Reversed order
        routePath = [
          startNearestPoint,
          ...orderedRouteCoords.slice(endPointIndex + 1, startPointIndex).reverse(),
          endNearestPoint
        ];
      }
      
      // Calculate the actual distance along this path
      const routeDistance = calculateDistance(routePath);
      
      // Return the candidate segment
      return {
        route,
        startPoint: startNearestPoint,
        endPoint: endNearestPoint,
        startDist,
        endDist,
        routePath,
        routeDistance,
        totalDist: startDist + endDist + routeDistance
      };
    });
  
    // Filter routes within radius
    const routesWithinRadius = routeSegments.filter(
      segment => segment.startDist <= searchRadius && segment.endDist <= searchRadius
    );
    
    // If no routes within radius, use all routes
    const eligibleRoutes = routesWithinRadius.length > 0 ? routesWithinRadius : routeSegments;
    
    // Sort by total distance to find shortest route
    eligibleRoutes.sort((a, b) => a.totalDist - b.totalDist);
    const bestSegment = eligibleRoutes[0];
  
    if (!bestSegment) {
      // Fallback to direct path if no routes found
      const directPath = [start, end];
      const distance = calculateDistance(directPath);
      return {
        id: 'navigation',
        name: 'Direct Route',
        type: 'walking',
        coordinates: directPath,
        distance,
        segments: [{
          coordinates: directPath,
          distance,
          description: `Direct path (${distance.toFixed(2)} km)`
        }]
      };
    }
  
    // Build navigation path segments
    const segments = [];
    let totalDistance = 0;
  
    // 1. Start to route segment
    const startSegment = {
      coordinates: [start, bestSegment.startPoint],
      distance: calculateDistance([start, bestSegment.startPoint]),
      description: `Walk to route (${bestSegment.startDist.toFixed(3)} km)`
    };
    segments.push(startSegment);
    totalDistance += startSegment.distance;
  
    // 2. Along route segment
    const routeSegment = {
      coordinates: bestSegment.routePath,
      distance: bestSegment.routeDistance,
      description: `Follow ${bestSegment.route.name} (${bestSegment.routeDistance.toFixed(2)} km)`,
      type: bestSegment.route.type
    };
    segments.push(routeSegment);
    totalDistance += routeSegment.distance;
  
    // 3. Route to destination segment
    const endSegment = {
      coordinates: [bestSegment.endPoint, end],
      distance: calculateDistance([bestSegment.endPoint, end]),
      description: `Walk to destination (${bestSegment.endDist.toFixed(3)} km)`
    };
    segments.push(endSegment);
    totalDistance += endSegment.distance;
  
    // Create the complete path for visualization
    const allCoordinates: [number, number][] = [
      start, 
      bestSegment.startPoint
    ];
    
    // Add all points along the route (if any)
    if (bestSegment.routePath.length > 1) {
      // Skip the first point since we already added startPoint
      allCoordinates.push(...bestSegment.routePath.slice(1));
    }
    
    // Add the end point
    if (calculateDistance([allCoordinates[allCoordinates.length - 1], end]) > 0.0001) {
      allCoordinates.push(end);
    }
  
    return {
      id: 'navigation',
      name: `Navigation Route (${totalDistance.toFixed(2)} km)`,
      type: 'walking',
      coordinates: allCoordinates,
      distance: totalDistance,
      segments
    };
  }

  const handleNavigate = (startId: string, endId: string) => {
    const startLandmark = mapState.landmarks.find((l) => l.id === startId);
    const endLandmark = mapState.landmarks.find((l) => l.id === endId);

    if (!startLandmark || !endLandmark) return;

    const navigationPath = findBestPath(
      startLandmark.position,
      endLandmark.position,
      mapState.routes
    );

    setNavigationRoute(navigationPath);
    setShowNavigation(false);
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
        <MapEvents onMapClick={handleMapClick} />
        
        {mapState.landmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            position={landmark.position}
            icon={LANDMARK_ICONS[landmark.type]}
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
                <p className="text-sm text-gray-600">
                  Distance: {calculateDistance(route.coordinates).toFixed(2)} km
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
          <>
            <Polyline
              positions={navigationRoute.coordinates}
              color="#F59E0B"
              weight={4}
              dashArray="10, 15"
            >
              <Popup>
                <div>
                  <h3 className="font-semibold">{navigationRoute.name}</h3>
                  <div className="text-sm text-gray-600 mt-2">
                    {navigationRoute.segments.map((segment, index) => (
                      <p key={index} className="mb-1">
                        {segment.description}
                      </p>
                    ))}
                  </div>
                </div>
              </Popup>
            </Polyline>
            {navigationRoute.segments.map((segment, index) => (
              <Polyline
                key={`segment-${index}`}
                positions={segment.coordinates}
                color="#F59E0B"
                weight={4}
                opacity={0.6}
              >
                <Popup>
                  <div>
                    <p className="text-sm font-medium">{segment.description}</p>
                  </div>
                </Popup>
              </Polyline>
            ))}
          </>
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

      {showRouteForm && (
        <RouteForm
          type={addingRoute!}
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
            Double-click your last point to complete the route.
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