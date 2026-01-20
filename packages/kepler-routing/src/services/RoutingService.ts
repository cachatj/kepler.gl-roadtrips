import { IRoutingService, RouteRequest, RouteResponse } from '../types';
import mapboxSdk from '@mapbox/mapbox-sdk/services/directions';
import polyline from '@mapbox/polyline';

export class OSRMService implements IRoutingService {
    constructor(private baseUrl: string = 'https://router.project-osrm.org') { }

    async getRoute(request: RouteRequest): Promise<RouteResponse> {
        const { origin, destination, profile } = request;
        const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
        const url = `${this.baseUrl}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return this.transformResponse(data);
    }

    private transformResponse(osrmResponse: any): RouteResponse {
        return {
            routes: osrmResponse.routes.map((route: any) => ({
                geometry: route.geometry,
                distance: route.distance,
                duration: route.duration,
                steps: route.legs[0].steps.map((step: any) => ({
                    maneuver: {
                        type: step.maneuver.type,
                        modifier: step.maneuver.modifier,
                        instruction: step.maneuver.instruction || step.name, // Fallback
                        location: step.maneuver.location,
                    },
                    distance: step.distance,
                    duration: step.duration,
                    name: step.name,
                })),
            })),
        };
    }
}

export class GoogleMapsService implements IRoutingService {
    constructor(private apiKey: string) { }

    async getRoute(request: RouteRequest): Promise<RouteResponse> {
        const { origin, destination, profile } = request;
        const modeMap: Record<string, string> = {
            driving: 'driving',
            cycling: 'bicycling',
            walking: 'walking',
        };

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${modeMap[profile]}&key=${this.apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Maps request failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${data.status} - ${data.error_message}`);
        }

        return this.transformResponse(data);
    }

    private transformResponse(gData: any): RouteResponse {
        const route = gData.routes[0];
        const leg = route.legs[0];

        return {
            routes: [{
                geometry: polyline.toGeoJSON(route.overview_polyline.points),
                distance: leg.distance.value,
                duration: leg.duration.value,
                steps: leg.steps.map((step: any) => ({
                    maneuver: {
                        type: step.maneuver || 'turn',
                        instruction: step.html_instructions.replace(/<[^>]*>?/gm, ''), // strip html
                        location: [step.end_location.lng, step.end_location.lat]
                    },
                    distance: step.distance.value,
                    duration: step.duration.value,
                    name: ''
                }))
            }]
        };
    }
}

export class MapboxService implements IRoutingService {
    private client: any;

    constructor(accessToken: string) {
        this.client = mapboxSdk({ accessToken });
    }

    async getRoute(request: RouteRequest): Promise<RouteResponse> {
        const { origin, destination, profile } = request;
        const profileMap: Record<string, string> = {
            driving: 'driving',
            cycling: 'cycling',
            walking: 'walking'
        };

        const response = await this.client.getDirections({
            profile: profileMap[profile],
            waypoints: [
                { coordinates: [origin.lng, origin.lat] },
                { coordinates: [destination.lng, destination.lat] }
            ],
            geometries: 'geojson',
            steps: true,
            overview: 'full'
        }).send();

        const data = response.body;
        return {
            routes: data.routes.map((route: any) => ({
                geometry: route.geometry,
                distance: route.distance, // meters
                duration: route.duration, // seconds
                steps: route.legs[0].steps.map((step: any) => ({
                    maneuver: {
                        type: step.maneuver.type,
                        modifier: step.maneuver.modifier,
                        instruction: step.maneuver.instruction,
                        location: step.maneuver.location
                    },
                    distance: step.distance,
                    duration: step.duration,
                    name: step.name
                }))
            }))
        };
    }
}

export class RoutingServiceFactory {
    static create(type: 'osrm' | 'google' | 'mapbox', config?: any): IRoutingService {
        switch (type) {
            case 'osrm':
                return new OSRMService(config?.baseUrl);
            case 'google':
                return new GoogleMapsService(config?.apiKey);
            case 'mapbox':
                return new MapboxService(config?.accessToken);
            default:
                throw new Error(`Unknown routing service: ${type}`);
        }
    }
}
