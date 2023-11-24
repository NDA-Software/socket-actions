import ws, { type ServerOptions, type WebSocket } from 'ws';
import express from 'express';
import { type IncomingMessage, type Server } from 'http';

import { executeOnFiles } from 'ts-cornucopia/file';
import type Action from './action';

export type DataType = Record<string, any>;

export type messageObject = {
    path: string,
    data: DataType
};

export type ActionParameters = {
    data: DataType,
    userData: Record<string, any>,
    socket: WebSocket
}

export type onConnection = (socket: WebSocket, req: IncomingMessage) => Promise<void>;

export type onAuth = (socket: WebSocket, message: string) => Promise<void>;
export type onMessage = (socket: WebSocket, messageObject: messageObject) => Promise<messageObject>;

export type onClose = (socket: WebSocket, code: number, reason: Buffer) => Promise<void>;
export type onError = (socket: WebSocket, err: Error) => Promise<void>;

export type onPrepareData = (socket: WebSocket, data: DataType) => Promise<ActionParameters>;

type EmptyPromise = (...args: any[]) => Promise<void>;
type EmptyFunction = (...args: any[]) => void;

export type SocketOptions = {
    serverOptions?: ServerOptions
    url?: string
    port?: number,
    actionsPath?: string,
    onConnection?: onConnection
    onAuth?: onAuth
    onClose?: onClose
    onError?: onError
    onMessage?: onMessage
    onPrepareData?: onPrepareData,
}

const defaultOptions = {
    url: 'http://localhost',
    port: 3000,
    actionsPath: './actions'
};

const onMessageEmptyFunction = async (_: any, messageObject: messageObject): Promise<messageObject> => messageObject;

const onPrepareDataEmptyFunction = async (socket: WebSocket, data: DataType): Promise<ActionParameters> => ({
    data,
    userData: {},
    socket
});

const emptyPromiseFunction = async (): Promise<void> => {};

const listenerFactory = (ctx: ws.Server, callback: EmptyPromise): EmptyFunction => {
    return (...args: any[]) => {
        void callback.apply(ctx, args);
    };
};

export default class Socket extends ws.Server {
    public readonly server: Server | undefined;

    private readonly onConnection: onConnection;
    private readonly onAuth: onAuth;
    private readonly onClose: onClose;
    private readonly onError: onError;
    private readonly onMessage: onMessage;
    private readonly onPrepareData: onPrepareData;

    private readonly Actions: Record<string, Action>;

    constructor(options: SocketOptions, callback?: () => void) {
        const {
            url,
            port,
            actionsPath,
            onConnection,
            onAuth,
            onClose,
            onError,
            onMessage,
            onPrepareData
        } = { ...defaultOptions, ...options };

        const actionFiles = executeOnFiles(actionsPath, (file) => file, { recursive: true });

        let { serverOptions } = options;

        if (serverOptions === undefined)
            serverOptions = {};

        const { server } = serverOptions;

        if (server === undefined) {
            const app = express();

            serverOptions.server = app.listen(port, () => {
                console.log(`Express listening at ${url}:${port}`);
            });
        }

        super(serverOptions, callback);

        this.Actions = {};

        for (const file of actionFiles) {
            const Action = require(process.cwd() + file.replace('./', '/'));

            this.Actions[file] = new Action();
        }

        this.server = serverOptions.server;

        this.onConnection = onConnection ?? emptyPromiseFunction;
        this.onAuth = onAuth ?? emptyPromiseFunction;
        this.onClose = onClose ?? emptyPromiseFunction;
        this.onError = onError ?? emptyPromiseFunction;

        this.onMessage = onMessage ?? onMessageEmptyFunction;
        this.onPrepareData = onPrepareData ?? onPrepareDataEmptyFunction;

        this.prepareAllActions().then(() => {
            this.on('connection', listenerFactory(this, this.connecting));

            console.log(`SocketActions listening at ${url.replace('http', 'ws')}:${port}`);
        }).catch((err) => {
            throw new Error(err);
        });
    }

    private async prepareAllActions (): Promise<void> {
        const promises: Array<Promise<void>> = [];

        for (const key in this.Actions) {
            const action = this.Actions[key] as Action;

            promises.push(action.prepareAction());
        }

        await Promise.all(promises);
    }

    private async connecting (socket: WebSocket, req: IncomingMessage): Promise<void> {
        try {
            await this.onConnection(socket, req);

            socket.on('error', listenerFactory(this, this.reportingError));

            socket.on('message', listenerFactory(this, this.authenticating));

            socket.on('close', listenerFactory(this, this.closing));
        } catch (err) {
            console.error(err);

            socket.close();
        }
    }

    private async authenticating (socket: WebSocket, message: string): Promise<void> {
        await this.onAuth(socket, message);

        socket.removeAllListeners('message');

        socket.on('message', listenerFactory(this, this.receivingMessage));
    }

    private async receivingMessage (socket: WebSocket, message: string): Promise<void> {
        try {
            let messageObject = JSON.parse(message) as messageObject;

            messageObject = await this.onMessage(socket, messageObject);

            const { path, data } = messageObject;

            const parameters = await this.onPrepareData(socket, data);

            await this.Actions[path]?.run(parameters);
        } catch (err) {
            console.error(err);
        }
    }

    private async reportingError (socket: WebSocket, err: Error): Promise<void> {
        await this.onError(socket, err);
    }

    private async closing (socket: WebSocket, code: number, reason: Buffer): Promise<void> {
        await this.onClose(socket, code, reason);
    }

    public override close(cb?: ((err?: Error | undefined) => void) | undefined): void {
        super.close(cb);

        this.server?.close();
    }
}
