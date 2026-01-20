// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import React, { useState } from 'react';
import styled from 'styled-components';
import { MapControlButton } from '@kepler.gl/components';
import { RoutingPanelFactory } from '@kepler.gl/kepler-routing';
import { CollectionsPanelFactory, GPXUploaderFactory } from '@kepler.gl/kepler-trips';
import { useDispatch, useSelector } from 'react-redux';

// Icons for the controls
const RoutingIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
    </svg>
);

const CollectionsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
    </svg>
);

const GPXIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15.5h-1.5V14h-1v3H8v-3H7v4.5H5.5v-5c0-.55.45-1 1-1H11c.55 0 1 .45 1 1v5zm3.5 0H14v-6h3.5c.55 0 1 .45 1 1V16c0 .55-.45 1-1 1h-2v1.5zm-2-9.5h3.5c.55 0 1 .45 1 1v2.5c0 .55-.45 1-1 1H13.5v-4.5zm-6-3.5c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-3zm1.5.5v2h1v-2h-1zm6-.5h3.5c.55 0 1 .45 1 1v2.5c0 .55-.45 1-1 1H15V5.5zm0 1v2.5h2V6.5h-2z" />
    </svg>
);

// Styled panel container
const PanelOverlay = styled.div`
  position: absolute;
  top: 60px;
  right: 60px;
  width: 320px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  z-index: 1000;
  background-color: ${props => props.theme.sidePanelBg || '#242730'};
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.sidePanelHeaderBg || '#3A414C'};
  
  h3 {
    margin: 0;
    font-size: 14px;
    color: white;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #A0A7B4;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  
  &:hover {
    color: white;
  }
`;

// Routing Control Factory
export function RoutingControlFactory() {
    const RoutingPanel = RoutingPanelFactory();

    const RoutingControl = ({ mapControls }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dispatch = useDispatch();
        const routingState = useSelector((state) => state.demo?.routing || {});

        return (
            <>
                <MapControlButton
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    data-tip
                    data-for="routing-control"
                >
                    <RoutingIcon />
                </MapControlButton>

                {isOpen && (
                    <PanelOverlay>
                        <PanelHeader>
                            <h3>🗺️ Routing</h3>
                            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
                        </PanelHeader>
                        <RoutingPanel dispatch={dispatch} routingState={routingState} />
                    </PanelOverlay>
                )}
            </>
        );
    };

    return RoutingControl;
}

RoutingControlFactory.deps = [];

// Collections Control Factory
export function CollectionsControlFactory() {
    const CollectionsPanel = CollectionsPanelFactory();

    const CollectionsControl = ({ mapControls }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dispatch = useDispatch();
        const collections = useSelector((state) => state.demo?.collections?.collections || []);
        const layers = useSelector((state) => state.demo?.keplerGl?.map?.visState?.layers || []);

        return (
            <>
                <MapControlButton
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    data-tip
                    data-for="collections-control"
                >
                    <CollectionsIcon />
                </MapControlButton>

                {isOpen && (
                    <PanelOverlay>
                        <PanelHeader>
                            <h3>📁 Collections</h3>
                            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
                        </PanelHeader>
                        <CollectionsPanel
                            dispatch={dispatch}
                            collections={collections}
                            layers={layers}
                        />
                    </PanelOverlay>
                )}
            </>
        );
    };

    return CollectionsControl;
}

CollectionsControlFactory.deps = [];

// GPX Upload Control Factory
export function GPXUploadControlFactory() {
    const GPXUploader = GPXUploaderFactory();

    const GPXUploadControl = ({ mapControls }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dispatch = useDispatch();

        return (
            <>
                <MapControlButton
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    data-tip
                    data-for="gpx-upload-control"
                >
                    <GPXIcon />
                </MapControlButton>

                {isOpen && (
                    <PanelOverlay style={{ width: '280px' }}>
                        <PanelHeader>
                            <h3>📍 GPX Import</h3>
                            <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
                        </PanelHeader>
                        <GPXUploader dispatch={dispatch} />
                    </PanelOverlay>
                )}
            </>
        );
    };

    return GPXUploadControl;
}

GPXUploadControlFactory.deps = [];
