import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { calculateRoute } from '../state/routingSlice';
import { NominatimGeocodingService, GeocodeResult } from '../services/GeocodingService';

interface RoutingPanelProps {
    dispatch: any;
    routingState: any;
}

const Panel = styled.div`
  padding: 16px;
  background-color: #242730;
  color: white;
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #a0a7b4;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background-color: #29323c;
  border: 1px solid #3a414c;
  color: white;
  border-radius: 4px;
  box-sizing: border-box;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background-color: #29323c;
  border: 1px solid #3a414c;
  color: white;
  border-radius: 4px;
  margin-top: 8px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #1f7cf4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #1a69d4;
  }
  
  &:disabled {
      background-color: #555;
      cursor: not-allowed;
  }
`;

const ResultBox = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #29323c;
  border-radius: 4px;
`;

const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ResultLabel = styled.span`
  color: #a0a7b4;
`;

const ResultValue = styled.span`
  color: white;
  font-weight: 500;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #29323c;
  border: 1px solid #3a414c;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 150px;
  overflow-y: auto;
  z-index: 100;
`;

const SuggestionItem = styled.li`
  padding: 8px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: #3a414c;
  }
`;

const CoordDisplay = styled.div`
  font-size: 10px;
  color: #6a7485;
  margin-top: 4px;
`;

// Geocoder instance
const geocoder = new NominatimGeocodingService();

export const RoutingPanel: React.FC<RoutingPanelProps> = ({ dispatch, routingState }) => {
    const [originText, setOriginText] = useState('');
    const [destText, setDestText] = useState('');
    const [profile, setProfile] = useState<'driving' | 'cycling' | 'walking'>('driving');

    const [originCoord, setOriginCoord] = useState<{ lat: number, lng: number } | null>(null);
    const [destCoord, setDestCoord] = useState<{ lat: number, lng: number } | null>(null);

    const [originSuggestions, setOriginSuggestions] = useState<GeocodeResult[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<GeocodeResult[]>([]);
    const [isGeocodingOrigin, setIsGeocodingOrigin] = useState(false);
    const [isGeocodingDest, setIsGeocodingDest] = useState(false);

    // Debounced geocoding for origin
    useEffect(() => {
        if (originText.length < 3) {
            setOriginSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsGeocodingOrigin(true);
            try {
                const results = await geocoder.search(originText);
                setOriginSuggestions(results);
            } catch (e) {
                console.error('Geocode error:', e);
            }
            setIsGeocodingOrigin(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [originText]);

    // Debounced geocoding for destination
    useEffect(() => {
        if (destText.length < 3) {
            setDestSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsGeocodingDest(true);
            try {
                const results = await geocoder.search(destText);
                setDestSuggestions(results);
            } catch (e) {
                console.error('Geocode error:', e);
            }
            setIsGeocodingDest(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [destText]);

    const selectOrigin = (result: GeocodeResult) => {
        setOriginText(result.label);
        setOriginCoord({ lat: result.latitude, lng: result.longitude });
        setOriginSuggestions([]);
    };

    const selectDest = (result: GeocodeResult) => {
        setDestText(result.label);
        setDestCoord({ lat: result.latitude, lng: result.longitude });
        setDestSuggestions([]);
    };

    const handleRoute = () => {
        if (originCoord && destCoord) {
            dispatch(calculateRoute({
                service: 'osrm',
                config: {},
                request: {
                    origin: originCoord,
                    destination: destCoord,
                    profile
                }
            }));
        } else {
            alert('Please select both origin and destination from suggestions');
        }
    };

    const { isLoading, error, currentRoute } = routingState || {};

    // When a route is calculated, add it to kepler.gl map as a trip-compatible GeoJSON
    useEffect(() => {
        if (currentRoute && currentRoute.routes && currentRoute.routes.length > 0) {
            const route = currentRoute.routes[0];
            const routeId = `route-${Date.now()}`;

            const geometry = route.geometry;
            const coords = geometry.coordinates || [];

            const startTime = Date.now();
            const totalDuration = route.duration * 1000; // milliseconds
            const totalPoints = coords.length;

            // Build 4D coordinates: [lng, lat, altitude, timestamp]
            // This format is required for kepler.gl trip layer auto-detection
            const fourDCoords: number[][] = [];
            for (let i = 0; i < coords.length; i++) {
                const coord = coords[i];
                const progress = totalPoints > 1 ? i / (totalPoints - 1) : 0;
                const timestamp = Math.round(startTime + progress * totalDuration);

                fourDCoords.push([
                    coord[0], // longitude
                    coord[1], // latitude
                    0,        // altitude
                    timestamp // timestamp for animation
                ]);
            }

            // Create GeoJSON Feature with 4D coordinates for trip layer
            const tripFeature = {
                type: 'Feature',
                properties: {
                    name: `Route: ${originText.split(',')[0]} to ${destText.split(',')[0]}`,
                    distance_km: (route.distance / 1000).toFixed(2),
                    duration_min: Math.round(route.duration / 60)
                },
                geometry: {
                    type: 'LineString',
                    coordinates: fourDCoords
                }
            };

            // Single row with GeoJSON for trip layer detection
            const fields = [
                { name: '_geojson', type: 'geojson', format: '', analyzerType: 'GEOMETRY' },
                { name: 'name', type: 'string', format: '', analyzerType: 'STRING' },
                { name: 'distance_km', type: 'real', format: '', analyzerType: 'FLOAT' },
                { name: 'duration_min', type: 'integer', format: '', analyzerType: 'INT' }
            ];

            const rows = [[
                tripFeature,
                tripFeature.properties.name,
                parseFloat(tripFeature.properties.distance_km as string),
                tripFeature.properties.duration_min
            ]];

            dispatch({
                type: '@@kepler.gl/ADD_DATA_TO_MAP',
                payload: {
                    datasets: {
                        info: {
                            id: routeId,
                            label: `Route (${(route.distance / 1000).toFixed(1)} km)`
                        },
                        data: { fields, rows }
                    },
                    options: { autoCreateLayers: true, centerMap: true }
                }
            });
        }
    }, [currentRoute, dispatch, originText, destText]);

    return (
        <Panel>
            <InputGroup>
                <Label>Origin (City, State or Address)</Label>
                <Input
                    value={originText}
                    onChange={e => { setOriginText(e.target.value); setOriginCoord(null); }}
                    placeholder="e.g. Cleveland, Ohio"
                />
                {isGeocodingOrigin && <CoordDisplay>Searching...</CoordDisplay>}
                {originCoord && <CoordDisplay>📍 {originCoord.lat.toFixed(4)}, {originCoord.lng.toFixed(4)}</CoordDisplay>}
                {originSuggestions.length > 0 && (
                    <SuggestionsList>
                        {originSuggestions.map((s, i) => (
                            <SuggestionItem key={i} onClick={() => selectOrigin(s)}>
                                {s.label}
                            </SuggestionItem>
                        ))}
                    </SuggestionsList>
                )}
            </InputGroup>

            <InputGroup>
                <Label>Destination (City, State or Address)</Label>
                <Input
                    value={destText}
                    onChange={e => { setDestText(e.target.value); setDestCoord(null); }}
                    placeholder="e.g. Columbus, Ohio"
                />
                {isGeocodingDest && <CoordDisplay>Searching...</CoordDisplay>}
                {destCoord && <CoordDisplay>📍 {destCoord.lat.toFixed(4)}, {destCoord.lng.toFixed(4)}</CoordDisplay>}
                {destSuggestions.length > 0 && (
                    <SuggestionsList>
                        {destSuggestions.map((s, i) => (
                            <SuggestionItem key={i} onClick={() => selectDest(s)}>
                                {s.label}
                            </SuggestionItem>
                        ))}
                    </SuggestionsList>
                )}
            </InputGroup>

            <InputGroup>
                <Label>Travel Mode</Label>
                <Select value={profile} onChange={e => setProfile(e.target.value as 'driving' | 'cycling' | 'walking')}>
                    <option value="driving">🚗 Driving</option>
                    <option value="cycling">🚴 Cycling</option>
                    <option value="walking">🚶 Walking</option>
                </Select>
            </InputGroup>

            <Button onClick={handleRoute} disabled={isLoading || !originCoord || !destCoord}>
                {isLoading ? 'Calculating...' : '🗺️ Get Directions'}
            </Button>

            {error && <ResultBox style={{ color: '#f44336' }}>Error: {error}</ResultBox>}

            {currentRoute && currentRoute.routes && currentRoute.routes[0] && (
                <ResultBox>
                    <ResultRow>
                        <ResultLabel>Distance:</ResultLabel>
                        <ResultValue>{(currentRoute.routes[0].distance / 1000).toFixed(2)} km</ResultValue>
                    </ResultRow>
                    <ResultRow>
                        <ResultLabel>Duration:</ResultLabel>
                        <ResultValue>{Math.round(currentRoute.routes[0].duration / 60)} min</ResultValue>
                    </ResultRow>
                    <ResultRow>
                        <ResultLabel>Points:</ResultLabel>
                        <ResultValue>{currentRoute.routes[0].geometry?.coordinates?.length || 0}</ResultValue>
                    </ResultRow>
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#6a7485' }}>
                        ✓ Route added to map layers
                    </div>
                </ResultBox>
            )}
        </Panel>
    );
};
