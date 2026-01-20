import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RouteRequest, RouteResponse } from '../types';
import { RoutingServiceFactory } from '../services/RoutingService';
import { GeocodeResult } from '../services/GeocodingService';

// Thunks
export const calculateRoute = createAsyncThunk(
    'routing/calculateRoute',
    async (
        payload: { service: 'osrm' | 'google' | 'mapbox'; config: any; request: RouteRequest },
        { rejectWithValue }
    ) => {
        try {
            const service = RoutingServiceFactory.create(payload.service, payload.config);
            return await service.getRoute(payload.request);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

interface RoutingState {
    currentRoute: RouteResponse | null;
    origin: GeocodeResult | null;
    destination: GeocodeResult | null;
    isLoading: boolean;
    error: string | null;
    routeHistory: RouteResponse[];
}

const initialState: RoutingState = {
    currentRoute: null,
    origin: null,
    destination: null,
    isLoading: false,
    error: null,
    routeHistory: [],
};

const routingSlice = createSlice({
    name: 'routing',
    initialState,
    reducers: {
        setOrigin: (state, action: PayloadAction<GeocodeResult | null>) => {
            state.origin = action.payload;
        },
        setDestination: (state, action: PayloadAction<GeocodeResult | null>) => {
            state.destination = action.payload;
        },
        clearRoute: (state) => {
            state.currentRoute = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(calculateRoute.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(calculateRoute.fulfilled, (state, action) => {
                state.currentRoute = action.payload;
                state.routeHistory.push(action.payload);
                state.isLoading = false;
            })
            .addCase(calculateRoute.rejected, (state, action) => {
                state.error = action.payload as string;
                state.isLoading = false;
            });
    },
});

export const { setOrigin, setDestination, clearRoute } = routingSlice.actions;
export default routingSlice.reducer;
