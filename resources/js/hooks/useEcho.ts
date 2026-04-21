import { useEffect, useRef, useCallback } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance: Echo | null = null;

export function getEcho(): Echo {
    if (!echoInstance) {
        window.Pusher = Pusher;
        
        const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || '14710fdd507c73748c4c';
        const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
        
        echoInstance = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: true,
            encrypted: true,
            disableStats: false,
            enabledTransports: ['ws', 'wss'],
        });
        
        // Log connection for debugging
        echoInstance.connector.pusher.connection.bind('connected', () => {
            console.log('✅ Pusher connected successfully');
        });
        
        echoInstance.connector.pusher.connection.bind('error', (err: any) => {
            console.error('❌ Pusher connection error:', err);
        });
    }
    return echoInstance;
}

export function useEcho() {
    const echoRef = useRef<Echo | null>(null);

    useEffect(() => {
        echoRef.current = getEcho();
        
        return () => {
            // Keep connection alive across components
        };
    }, []);

    const subscribe = useCallback(<T = any>(
        channel: string,
        event: string,
        callback: (data: T) => void
    ) => {
        if (!echoRef.current) return () => {};
        
        try {
            echoRef.current.channel(channel).listen(event, callback);
            console.log(`📡 Subscribed to ${channel}:${event}`);
            
            return () => {
                try {
                    echoRef.current?.channel(channel)?.stopListening(event, callback);
                } catch (e) {
                    // Ignore cleanup errors
                }
            };
        } catch (e) {
            console.warn(`Failed to subscribe to ${channel}:${event}`, e);
            return () => {};
        }
    }, []);

    const leaveChannel = useCallback((channel: string) => {
        echoRef.current?.leave(channel);
    }, []);

    return { echo: echoRef.current, subscribe, leaveChannel };
}