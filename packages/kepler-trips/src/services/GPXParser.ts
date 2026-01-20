import { gpx } from '@mapbox/togeojson';
import * as turf from '@turf/turf';

export interface ParsedTrack {
    id: string;
    name: string;
    geometry: any; // GeoJSON LineString
    timestamps: number[];
    elevations: number[];
    distance: number;
    duration: number;
}

export class GPXParser {
    static async parse(file: File): Promise<ParsedTrack[]> {
        const text = await file.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const geojson = gpx(xml);

        return geojson.features
            .filter((f: any) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')
            .map((f: any) => this.processFeature(f));
    }

    private static processFeature(feature: any): ParsedTrack {
        const coords = feature.geometry.coordinates;
        const props = feature.properties || {};
        const times = props.coordTimes || [];

        // Flatten if MultiLineString (simple handling)
        const flatCoords = feature.geometry.type === 'MultiLineString'
            ? coords.flat()
            : coords;

        let distance = 0;
        const timestamps: number[] = [];
        const elevations: number[] = [];

        // Parse timestamps and accumulate distance
        for (let i = 0; i < flatCoords.length; i++) {
            const c = flatCoords[i];
            if (c.length > 2) elevations.push(c[2]);

            if (times[i]) {
                timestamps.push(new Date(times[i]).getTime());
            }

            if (i > 0) {
                distance += turf.distance(flatCoords[i - 1], flatCoords[i], { units: 'meters' });
            }
        }

        const duration = timestamps.length > 1
            ? timestamps[timestamps.length - 1] - timestamps[0]
            : 0;

        return {
            id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: props.name || 'Untitled Trip',
            geometry: feature.geometry,
            timestamps,
            elevations,
            distance,
            duration
        };
    }
}
