export interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  profile: 'driving' | 'cycling' | 'walking';
  alternatives?: boolean;
}

export interface RouteStep {
  maneuver: {
    type: string;
    modifier?: string;
    instruction: string;
    location: [number, number];
  };
  distance: number;
  duration: number;
  name: string;
}

export interface RouteResponse {
  routes: Array<{
    geometry: any; // GeoJSON LineString
    distance: number; // meters
    duration: number; // seconds
    steps: RouteStep[];
  }>;
}

export interface IRoutingService {
  getRoute(request: RouteRequest): Promise<RouteResponse>;
}
