import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkState = () => {
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? false);
        });

        return () => unsubscribe();
    }, []);

    return { isConnected, isInternetReachable };
};
