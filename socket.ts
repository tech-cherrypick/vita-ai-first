import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

class SocketService {
    private static instance: Socket | null = null;
    private static pendingRooms: Set<string> = new Set();

    public static getInstance(): Socket {
        if (!SocketService.instance) {
            console.log('[Socket] Creating connection to', SOCKET_URL);

            SocketService.instance = io(SOCKET_URL, {
                transports: ['polling', 'websocket'],
                upgrade: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            SocketService.instance.on('connect', () => {
                const transport = SocketService.instance?.io?.engine?.transport?.name;
                console.log('[Socket] ✅ Connected via', transport, '| id:', SocketService.instance?.id);

                SocketService.instance?.io?.engine?.on('upgrade', () => {
                    console.log('[Socket] ⬆️ Upgraded to', SocketService.instance?.io?.engine?.transport?.name);
                });

                SocketService.pendingRooms.forEach(room => {
                    console.log('[Socket] Re-joining room:', room);
                    SocketService.instance?.emit('join_room', room);
                });
            });

            SocketService.instance.on('connect_error', (error) => {
                console.error('[Socket] ❌ Connection Error:', error.message);
            });

            SocketService.instance.on('disconnect', (reason) => {
                console.warn('[Socket] 🔌 Disconnected:', reason);
            });
        }
        return SocketService.instance;
    }

    public static joinRoom(roomId: string | number): void {
        const id = String(roomId);
        SocketService.pendingRooms.add(id);
        const socket = SocketService.getInstance();
        if (socket.connected) {
            console.log('[Socket] Joining room:', id);
            socket.emit('join_room', id);
        } else {
            console.log('[Socket] Queued room (not connected yet):', id);
        }
    }

    public static disconnect(): void {
        if (SocketService.instance) {
            SocketService.instance.disconnect();
            SocketService.instance = null;
            SocketService.pendingRooms.clear();
        }
    }
}

export const getSocket = () => SocketService.getInstance();
export const joinRoom = (roomId: string | number) => SocketService.joinRoom(roomId);
