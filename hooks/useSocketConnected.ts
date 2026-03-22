import { useState, useEffect } from 'react';
import { getSocket } from '../socket';

export const useSocketConnected = (): boolean => {
    const socket = getSocket();
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [socket]);

    return isConnected;
};

