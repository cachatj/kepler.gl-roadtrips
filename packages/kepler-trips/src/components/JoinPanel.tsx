import React, { useState } from 'react';
import styled from 'styled-components';

interface JoinPanelProps {
    layers: any[]; // Kepler layers
    onJoin: (config: any) => void;
}

const Panel = styled.div`
  padding: 16px;
  color: white;
  background: #242730;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: #29323c;
  color: white;
  border: 1px solid #444;
  margin-bottom: 10px;
`;

export const JoinPanel: React.FC<JoinPanelProps> = ({ layers, onJoin }) => {
    const [layer1, setLayer1] = useState('');
    const [layer2, setLayer2] = useState('');
    const [mode, setMode] = useState('proximity');
    const [tolerance, setTolerance] = useState(50); // meters

    const handleJoin = () => {
        if (!layer1 || !layer2) return;
        onJoin({
            layer1Id: layer1,
            layer2Id: layer2,
            mode,
            tolerance
        });
    };

    return (
        <Panel>
            <h3>Spatial Join</h3>
            <label>Target Layer (Points/Trips)</label>
            <Select value={layer1} onChange={e => setLayer1(e.target.value)}>
                <option value="">Select Layer...</option>
                {layers.map(l => <option key={l.id} value={l.id}>{l.config.label}</option>)}
            </Select>

            <label>Joining Layer (Geometry)</label>
            <Select value={layer2} onChange={e => setLayer2(e.target.value)}>
                <option value="">Select Layer...</option>
                {layers.map(l => <option key={l.id} value={l.id}>{l.config.label}</option>)}
            </Select>

            <label>Join Type</label>
            <Select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="proximity">Proximity (Distance)</option>
                <option value="intersect">Intersection</option>
            </Select>

            {mode === 'proximity' && (
                <div>
                    <label>Tolerance (meters)</label>
                    <input
                        type="number"
                        value={tolerance}
                        onChange={e => setTolerance(parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '8px', background: '#333', border: 'none', color: 'white' }}
                    />
                </div>
            )}

            <button
                onClick={handleJoin}
                style={{ width: '100%', padding: '10px', marginTop: '15px', background: '#1f7cf4', border: 'none', color: 'white' }}
            >
                Run Join Operation
            </button>
        </Panel>
    );
}
