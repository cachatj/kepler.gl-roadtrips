import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TripCollection {
    id: string;
    name: string;
    color: string;
    tripIds: string[];
    visible: boolean;
}

interface CollectionsState {
    collections: TripCollection[];
    activeCollection: string | null;
}

const initialState: CollectionsState = {
    collections: [],
    activeCollection: null,
};

const collectionsSlice = createSlice({
    name: 'collections',
    initialState,
    reducers: {
        addCollection: (state, action: PayloadAction<TripCollection>) => {
            state.collections.push(action.payload);
        },
        addTripToCollection: (state, action: PayloadAction<{ collectionId: string; tripId: string }>) => {
            const col = state.collections.find((c) => c.id === action.payload.collectionId);
            if (col && !col.tripIds.includes(action.payload.tripId)) {
                col.tripIds.push(action.payload.tripId);
            }
        },
        removeTripFromCollection: (state, action: PayloadAction<{ collectionId: string; tripId: string }>) => {
            const col = state.collections.find((c) => c.id === action.payload.collectionId);
            if (col) {
                col.tripIds = col.tripIds.filter((id) => id !== action.payload.tripId);
            }
        },
        toggleCollectionVisibility: (state, action: PayloadAction<string>) => {
            const col = state.collections.find((c) => c.id === action.payload);
            if (col) col.visible = !col.visible;
        },
        deleteCollection: (state, action: PayloadAction<string>) => {
            state.collections = state.collections.filter((c) => c.id !== action.payload);
        },
    },
});

export const {
    addCollection,
    addTripToCollection,
    removeTripFromCollection,
    toggleCollectionVisibility,
    deleteCollection,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
