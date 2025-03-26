export interface Landmark {
  id: string;
  name: string;
  description?: string;
  position: [number, number];
  type: 'building' | 'parking' | 'entrance' | 'other';
}

export interface Route {
  id: string;
  name: string;
  type: 'vehicle' | 'walking';
  coordinates: [number, number][];
}

export interface MapState {
  center: [number, number];
  zoom: number;
  landmarks: Landmark[];
  routes: Route[];
  mapType: 'terrain' | 'satellite';
}