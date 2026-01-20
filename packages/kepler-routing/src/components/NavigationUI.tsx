import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RouteResponse, RouteStep } from '../types';

interface NavigationUIProps {
    route: RouteResponse;
    currentLocation?: { latitude: number; longitude: number };
}

const NavContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 300px;
  background: #242730;
  color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 1000;
  font-family: 'Uber Move', sans-serif; // Or system default
`;

const NextManeuver = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const DirectionIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #1f7cf4;
  border-radius: 50%;
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
`;

const InstructionText = styled.div`
  font-size: 18px;
  font-weight: 500;
`;

const StepList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid #444;
  padding-top: 10px;
`;

const StepItem = styled.div<{ active: boolean }>`
  padding: 8px;
  border-left: 2px solid ${props => props.active ? '#1f7cf4' : 'transparent'};
  color: ${props => props.active ? 'white' : '#aaa'};
  background: ${props => props.active ? '#2c333f' : 'transparent'};
`;

export const NavigationUI: React.FC<NavigationUIProps> = ({ route, currentLocation }) => {
    // Simplified step tracking based on distance or list index
    // In a real app, this would use turf.distance to find current step on route
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Simulate step progression for demo if location not provided
    useEffect(() => {
        if (!currentLocation && currentStepIndex < (route.routes[0].steps.length - 1)) {
            // const timer = setTimeout(() => setCurrentStepIndex(i => i + 1), 5000);
            // return () => clearTimeout(timer);
        }
    }, [currentStepIndex, currentLocation, route]);

    const steps = route.routes[0].steps;
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];

    if (!currentStep) return null;

    return (
        <NavContainer>
            <NextManeuver>
                <DirectionIcon>
                    {/* Icon based on currentStep.maneuver.type */}
                    ➤
                </DirectionIcon>
                <div>
                    <InstructionText>{currentStep.maneuver.instruction}</InstructionText>
                    <div style={{ fontSize: '14px', color: '#ccc', marginTop: '4px' }}>
                        {(currentStep.distance).toFixed(0)}m
                    </div>
                </div>
            </NextManeuver>

            <StepList>
                {steps.map((step, i) => (
                    <StepItem key={i} active={i === currentStepIndex} onClick={() => setCurrentStepIndex(i)}>
                        <div style={{ fontWeight: 500 }}>{step.maneuver.instruction}</div>
                        <div style={{ fontSize: '12px' }}>{(step.distance / 1000).toFixed(2)} km</div>
                    </StepItem>
                ))}
            </StepList>
        </NavContainer>
    );
};
