import React, { useCallback } from 'react';
import styled from 'styled-components';

// Import parser
import { GPXParser } from '../services/GPXParser';

// Minimal props
interface GPXUploaderProps {
    dispatch: (action: any) => void;
}

const UploaderContainer = styled.div`
    padding: 16px;
    background-color: #242730;
`;

const Title = styled.div`
    margin-bottom: 12px;
    font-weight: 500;
    font-size: 14px;
    color: white;
`;

const Description = styled.div`
    margin-bottom: 12px;
    font-size: 12px;
    color: #A0A7B4;
`;

const FileInput = styled.input`
    color: #A0A7B4;
    font-size: 12px;
    
    &::file-selector-button {
        background: #1f7cf4;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        
        &:hover {
            background: #1a69d4;
        }
    }
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
    margin-top: 10px;
    font-size: 12px;
    color: ${props => props.isError ? '#f44336' : '#4caf50'};
`;

export const GPXUploader: React.FC<GPXUploaderProps> = ({ dispatch }) => {
    const [status, setStatus] = React.useState<{ message: string; isError: boolean } | null>(null);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setStatus({ message: 'Parsing GPX files...', isError: false });

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const tracks = await GPXParser.parse(file);

                tracks.forEach(track => {
                    const coords = track.geometry.coordinates;

                    // Build rows - each trackpoint becomes a row
                    // Format: [latitude, longitude, altitude, timestamp, speed]
                    const rows: any[][] = [];

                    for (let j = 0; j < coords.length; j++) {
                        const coord = coords[j];
                        const lng = coord[0];
                        const lat = coord[1];
                        const alt = coord[2] || 0;
                        const timestamp = track.timestamps[j] || null;

                        // Calculate speed from previous point (m/s)
                        let speed = 0;
                        if (j > 0 && track.timestamps[j] && track.timestamps[j - 1]) {
                            const prevCoord = coords[j - 1];
                            const timeDiff = (track.timestamps[j] - track.timestamps[j - 1]) / 1000; // seconds
                            if (timeDiff > 0) {
                                // Simple distance calculation using haversine approximation
                                const R = 6371000; // Earth radius in meters
                                const dLat = (lat - prevCoord[1]) * Math.PI / 180;
                                const dLng = (lng - prevCoord[0]) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(prevCoord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const distance = R * c;
                                speed = distance / timeDiff;
                            }
                        }

                        rows.push([lat, lng, alt, timestamp, speed, track.name]);
                    }

                    // Define fields matching kepler.gl's expected format
                    const fields = [
                        { name: 'latitude', type: 'real', format: '', analyzerType: 'FLOAT' },
                        { name: 'longitude', type: 'real', format: '', analyzerType: 'FLOAT' },
                        { name: 'altitude', type: 'real', format: '', analyzerType: 'FLOAT' },
                        { name: 'timestamp', type: 'timestamp', format: 'x', analyzerType: 'DATETIME' },
                        { name: 'speed', type: 'real', format: '', analyzerType: 'FLOAT' },
                        { name: 'track_name', type: 'string', format: '', analyzerType: 'STRING' }
                    ];

                    // Dispatch addDataToMap with CSV-style data format
                    dispatch({
                        type: '@@kepler.gl/ADD_DATA_TO_MAP',
                        payload: {
                            datasets: {
                                info: {
                                    id: track.id,
                                    label: track.name
                                },
                                data: {
                                    fields,
                                    rows
                                }
                            },
                            options: {
                                autoCreateLayers: true,
                                centerMap: true
                            }
                        }
                    });
                });

                setStatus({ message: `Loaded ${tracks.length} track(s) with ${tracks.reduce((sum, t) => sum + t.geometry.coordinates.length, 0)} points`, isError: false });

            } catch (err: any) {
                console.error('Failed to parse GPX:', err);
                setStatus({ message: `Error: ${err.message}`, isError: true });
            }
        }

        // Reset file input
        e.target.value = '';
    }, [dispatch]);

    return (
        <UploaderContainer>
            <Title>Import GPX Trip</Title>
            <Description>
                Upload GPX files to visualize GPS tracks. Each trackpoint becomes a data row with lat, lng, altitude, timestamp, and speed.
            </Description>
            <FileInput
                type="file"
                accept=".gpx"
                multiple
                onChange={handleFileUpload}
            />
            {status && (
                <StatusMessage isError={status.isError}>
                    {status.message}
                </StatusMessage>
            )}
        </UploaderContainer>
    );
};
