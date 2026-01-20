import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocation } from '../state/locationSlice';

// Todo: Type the selector properly based on root state
export const useGeolocation = (isTracking: boolean) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!isTracking) return;

        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                dispatch(updateLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    heading: position.coords.heading,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                }));
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isTracking, dispatch]);
};
