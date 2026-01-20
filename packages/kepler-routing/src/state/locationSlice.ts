import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
    currentLocation: {
        latitude: number;
        longitude: number;
        heading: number | null;
        accuracy?: number;
        timestamp?: number;
    };
    locationHistory: Array<{ latitude: number; longitude: number }>;
    isTracking: boolean;
    followMode: boolean;
}

const initialState: LocationState = {
    currentLocation: { latitude: 0, longitude: 0, heading: null },
    locationHistory: [],
    isTracking: false,
    followMode: false,
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        updateLocation: (state, action: PayloadAction<any>) => {
            // Basic update logic. In a real app we might debounce or filter jumps.
            state.currentLocation = action.payload;
            if (state.isTracking && action.payload.latitude && action.payload.longitude) {
                state.locationHistory.push({
                    latitude: action.payload.latitude,
                    longitude: action.payload.longitude
                });
            }
        },
        toggleTracking: (state) => {
            state.isTracking = !state.isTracking;
            if (!state.isTracking) state.followMode = false;
        },
        toggleFollowMode: (state) => {
            state.followMode = !state.followMode;
        },
    },
});

export const { updateLocation, toggleTracking, toggleFollowMode } = locationSlice.actions;
export default locationSlice.reducer;
