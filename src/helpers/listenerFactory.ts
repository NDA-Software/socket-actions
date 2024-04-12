import type Socket from '../server/socket';
import { type ClientSocket } from '../server/socket';

export type FactoryPromise = (...args: any[]) => Promise<void>;
export type FactoryFunction = (...args: any[]) => void;

const listenerFactory = (ctx: Socket | WebSocket, socket: ClientSocket | null, callback: FactoryPromise): FactoryFunction => {
    return (...args: any[]) => {
        if (socket !== null)
            args = [socket, ...args];

        void callback.apply(ctx, args);
    };
};

export default listenerFactory;
