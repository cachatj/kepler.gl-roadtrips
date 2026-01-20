import { MapControlFactory } from '@kepler.gl/components';
import { RoutingPanel } from './components/RoutingPanel';
import { NavigationUI } from './components/NavigationUI';
import routingReducer from './state/routingSlice';
import locationReducer from './state/locationSlice';

// Factory for Routing Panel (sidebar)
export const RoutingPanelFactory = () => RoutingPanel;

// Factory for Navigation UI (map overlay)
// We might want to inject this into MapContainer or similar. 
// For now, let's export it as a helper to be used in a custom map control or overlay.
export const NavigationUIFactory = () => NavigationUI;

// Reducers
export { routingReducer, locationReducer };

// Plugin to adding routing state to root reducer
export const routingPlugin = (state: any = {}, action: any) => {
    // This is a rough plugin pattern, typically we combineReducers
    // But Kepler's plugin system handles it differently.
    // We will export the reducer to be mounted manually in store.js
    return state;
}
