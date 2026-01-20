import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { TripCollection, addCollection, addTripToCollection, removeTripFromCollection } from '../state/collectionsSlice';

// Stub dispatch/selector - in real app, use typed hooks
interface CollectionsPanelProps {
    collections: TripCollection[];
    dispatch: any;
    layers: any[]; // Kepler layers
}

const PanelContainer = styled.div`
  padding: 16px;
  color: white;
  background-color: #242730;
`;

const CollectionItem = styled.div`
  background: #3A414C;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
`;

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({ collections, dispatch, layers }) => {
    const [newColName, setNewColName] = useState('');

    const handleCreate = () => {
        if (!newColName.trim()) return;
        dispatch(addCollection({
            id: `col-${Date.now()}`,
            name: newColName,
            color: '#ffcc00',
            tripIds: [],
            visible: true
        }));
        setNewColName('');
    };

    const onDragEnd = (result: any) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        if (source.droppableId !== destination.droppableId) {
            // Logic to move trip between collections
            if (source.droppableId !== 'unassigned') {
                dispatch(removeTripFromCollection({ collectionId: source.droppableId, tripId: draggableId }));
            }
            if (destination.droppableId !== 'unassigned') {
                dispatch(addTripToCollection({ collectionId: destination.droppableId, tripId: draggableId }));
            }
        }
    };

    // Filter layers that are potential trips
    const tripLayers = layers.filter(l => l.type === 'trip' || l.type === 'geojson');
    const assignedIds = collections.flatMap(c => c.tripIds);
    const unassignedTrips = tripLayers.filter(l => !assignedIds.includes(l.config.dataId)); // Using dataId or id? Depends on Kepler layer model

    return (
        <PanelContainer>
            <h3>Collections</h3>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <input
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    placeholder="New Collection"
                    style={{ flex: 1, marginRight: '5px' }}
                />
                <button onClick={handleCreate}>+</button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="unassigned">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '50px', border: '1px dashed #555', padding: '5px' }}>
                            <h4>Unassigned Layers</h4>
                            {unassignedTrips.map((layer, index) => (
                                <Draggable key={layer.id} draggableId={layer.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                            style={{ ...provided.draggableProps.style, padding: '4px', margin: '4px 0', background: '#444' }}>
                                            {layer.config.label}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {collections.map(col => (
                    <Droppable key={col.id} droppableId={col.id}>
                        {(provided) => (
                            <CollectionItem ref={provided.innerRef} {...provided.droppableProps}>
                                <h4>{col.name} ({col.tripIds.length})</h4>
                                {col.tripIds.map((tripId, index) => {
                                    const layer = layers.find(l => l.config.dataId === tripId || l.id === tripId); // approximate matching
                                    return (
                                        <Draggable key={tripId} draggableId={tripId} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style, padding: '4px', margin: '4px 0', background: '#555' }}>
                                                    {layer?.config?.label || tripId}
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </CollectionItem>
                        )}
                    </Droppable>
                ))}
            </DragDropContext>
        </PanelContainer>
    );
}
