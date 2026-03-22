import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

class SocketService {
    private static instance: Socket | null = null;

    public static getInstance(): Socket {
        if (!SocketService.instance) {
            SocketService.instance = io(SOCKET_URL, {
                transports: ['websocket'],
                upgrade: false,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                timeout: 20000,
            });

            SocketService.instance.on('connect', () => {
                console.log('✅ Connected to WebSocket server via', SocketService.instance?.io?.engine?.transport?.name);
            });

            SocketService.instance.on('connect_error', (error) => {
                console.error('❌ WebSocket Connection Error:', error);
            });
        }
        return SocketService.instance;
    }

    public static disconnect(): void {
        if (SocketService.instance) {
            SocketService.instance.disconnect();
            SocketService.instance = null;
        }
    }
}

export const getSocket = () => SocketService.getInstance();
