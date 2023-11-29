import ws, { type ServerOptions, type WebSocket } from 'ws';
import express from 'express';
import { type IncomingMessage, type Server } from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuid } from 'uuid';

import { executeOnFiles } from 'ts-cornucopia/file';
import type Action from './action';

export type DataType = Record<string, any>;

export type MessageObject = {
    path: string,
    data: DataType
};

export type ActionParameters = {
    data: DataType,
    userData: DataType,
    socket: ClientSocket
}

export type ClientSocket = WebSocket & {
    userData: DataType
};

export type onConnection = (socket: ClientSocket, req: IncomingMessage) => Promise<void>;

export type onAuth = (socket: ClientSocket, message: string) => Promise<void>;
export type onMessage = (socket: ClientSocket, messageObject: MessageObject) => Promise<void>;

export type onClose = (socket: ClientSocket) => Promise<void>;
export type onError = (socket: ClientSocket, err: Error) => Promise<void>;

type EmptyPromise = (...args: any[]) => Promise<void>;
type EmptyFunction = (...args: any[]) => void;

export type SocketOptions = {
    serverOptions?: ServerOptions
    url?: string
    port?: number,
    actionsPath?: string,
    disableAuthentication?: boolean,
    onConnection?: onConnection
    onAuth?: onAuth
    onClose?: onClose
    onError?: onError
    onMessage?: onMessage
}

const defaultOptions = {
    url: 'http://localhost',
    port: 3000,
    actionsPath: './actions',
    disableAuthentication: false
};

const authenticationNotImplemented = async (): Promise<void> => {
    throw new Error('Authentication not implemented. Maybe you forgot to disable it.');
};

const emptyPromiseFunction = async (): Promise<void> => {};

const listenerFactory = (ctx: ws.Server, socket: ClientSocket | null, callback: EmptyPromise): EmptyFunction => {
    return (...args: any[]) => {
        if (socket !== null)
            args = [socket, ...args];

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

    private readonly Actions: Record<string, Action>;

    private readonly disableAuthentication: boolean;

    constructor(options: SocketOptions) {
        const {
            url,
            port,
            actionsPath,
            disableAuthentication,
            onConnection,
            onAuth,
            onClose,
            onError,
            onMessage
        } = { ...defaultOptions, ...options };

        const actionFiles = executeOnFiles(actionsPath, (file) => file, { recursive: true });

        let { serverOptions } = options;

        if (serverOptions === undefined)
            serverOptions = {};

        const { server } = serverOptions;

        if (server === undefined) {
            const app = express();

            app.use(bodyParser.json());

            app.use(cors({
                origin: url,
                optionsSuccessStatus: 200
            }));

            serverOptions.server = app.listen(port, () => {
                console.log(`Express listening at ${url}:${port}`);
            });
        }

        super(serverOptions);

        this.Actions = {};

        for (const file of actionFiles) {
            const fullFilePath = process.cwd() + file.replace('./', '/');

            const Action = require(fullFilePath);

            let fileName = file
                .replace(actionsPath, '')
                .replace('.ts', '')
                .replace('.js', '');

            if (fileName[0] === '/')
                fileName = fileName.substring(1);

            this.Actions[fileName] = new Action();
        }

        this.server = serverOptions.server;

        this.onConnection = onConnection ?? emptyPromiseFunction;
        this.onAuth = onAuth ?? authenticationNotImplemented;
        this.onClose = onClose ?? emptyPromiseFunction;
        this.onError = onError ?? emptyPromiseFunction;
        this.onMessage = onMessage ?? emptyPromiseFunction;

        this.prepareAllActions().then(() => {
            this.on('connection', listenerFactory(this, null, this.connecting));

            console.log(`SocketActions listening at ${url.replace('http', 'ws')}:${port}`);
        }).catch((err) => {
            throw new Error(err);
        });

        this.disableAuthentication = disableAuthentication;

        if (disableAuthentication && onAuth !== undefined)
            console.warn('onAuth event both added and supressed by disableAuthentication option.');
    }

    private async prepareAllActions (): Promise<void> {
        const promises: Array<Promise<void>> = [];

        for (const key in this.Actions) {
            const action = this.Actions[key] as Action;

            promises.push(action.prepareAction());
        }

        await Promise.all(promises);
    }

    private async connecting (socket: ClientSocket, req: IncomingMessage): Promise<void> {
        try {
            await this.onConnection(socket, req);

            socket.on('error', listenerFactory(this, socket, this.reportingError));

            if (this.disableAuthentication)
                socket.on('message', listenerFactory(this, socket, this.receivingMessage));
            else
                socket.on('message', listenerFactory(this, socket, this.authenticating));

            socket.on('close', listenerFactory(this, socket, this.closing));
        } catch (err) {
            console.error(err);

            socket.close();
        }
    }

    private async authenticating (socket: ClientSocket, message: string): Promise<void> {
        try {
            await this.onAuth(socket, message);

            if (socket.userData === undefined)
                socket.userData = {};

            if (socket.userData.id === undefined)
                socket.userData.id = uuid();
        } catch (err) {
            await this.reportingError(socket, err as Error);

            return;
        }

        socket.removeAllListeners('message');

        socket.on('message', listenerFactory(this, socket, this.receivingMessage));
    }

    private async receivingMessage (socket: ClientSocket, message: string): Promise<void> {
        try {
            const messageObject = JSON.parse(message) as MessageObject;

            await this.onMessage(socket, messageObject);

            const { path, data } = messageObject;

            const parameters = {
                socket,
                userData: socket.userData,
                data
            };

            await this.Actions[path]?.run(parameters);
        } catch (err) {
            await this.reportingError(socket, err as Error);
        }
    }

    private async reportingError (socket: ClientSocket, err: Error): Promise<void> {
        await this.onError(socket, err);
    }

    private async closing (socket: ClientSocket): Promise<void> {
        await this.onClose(socket);
    }

    public override close(cb?: ((err?: Error | undefined) => void) | undefined): void {
        super.close(cb);

        this.server?.close();
    }
}
