import mapboxSdk from '@mapbox/mapbox-sdk/services/geocoding';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    label: string;
    bbox?: [number, number, number, number];
}

export interface IGeocodingService {
    search(query: string): Promise<GeocodeResult[]>;
    reverse?(lat: number, lng: number): Promise<GeocodeResult>;
}

export class MapboxGeocodingService implements IGeocodingService {
    private client: any;

    constructor(accessToken: string) {
        this.client = mapboxSdk({ accessToken });
    }

    async search(query: string): Promise<GeocodeResult[]> {
        const response = await this.client.forwardGeocode({
            query,
            limit: 5
        }).send();

        return response.body.features.map((feat: any) => ({
            latitude: feat.center[1],
            longitude: feat.center[0],
            label: feat.place_name,
            bbox: feat.bbox
        }));
    }
}

export class GoogleGeocodingService implements IGeocodingService {
    constructor(private apiKey: string) { }

    async search(query: string): Promise<GeocodeResult[]> {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Geocoding API error: ${data.status}`);
        }

        return data.results.map((result: any) => ({
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            label: result.formatted_address,
            bbox: result.geometry.bounds ? [
                result.geometry.bounds.southwest.lng,
                result.geometry.bounds.southwest.lat,
                result.geometry.bounds.northeast.lng,
                result.geometry.bounds.northeast.lat
            ] : undefined
        }));
    }
}

// Free geocoding service using OpenStreetMap's Nominatim
export class NominatimGeocodingService implements IGeocodingService {
    private baseUrl: string = 'https://nominatim.openstreetmap.org';

    async search(query: string): Promise<GeocodeResult[]> {
        const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'kepler.gl-roadtrips/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim request failed: ${response.statusText}`);
        }

        const data = await response.json();

        return data.map((result: any) => ({
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            label: result.display_name,
            bbox: result.boundingbox ? [
                parseFloat(result.boundingbox[2]),
                parseFloat(result.boundingbox[0]),
                parseFloat(result.boundingbox[3]),
                parseFloat(result.boundingbox[1])
            ] : undefined
        }));
    }
}

export class GeocodingServiceFactory {
    static create(type: 'mapbox' | 'google' | 'nominatim', config?: any): IGeocodingService {
        if (type === 'mapbox') return new MapboxGeocodingService(config?.accessToken);
        if (type === 'google') return new GoogleGeocodingService(config?.apiKey);
        if (type === 'nominatim') return new NominatimGeocodingService();
        throw new Error(`Unknown geocoding service: ${type}`);
    }
}
