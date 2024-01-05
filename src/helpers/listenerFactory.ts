import type WebSocket from 'ws';

export type FactoryPromise = (...args: any[]) => Promise<void>;
export type FactoryFunction = (...args: any[]) => void;

const listenerFactory = (ctx: WebSocket.Server | WebSocket, socket: ClientSocket | null, callback: FactoryPromise): FactoryFunction => {
    return (...args: any[]) => {
        if (socket !== null)
            args = [socket, ...args];

        void callback.apply(ctx, args);
    };
};

export default listenerFactory;
