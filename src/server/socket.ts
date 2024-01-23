import ws, { type ServerOptions } from 'ws';
import express from 'express';
import { type IncomingMessage, type Server } from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import listenerFactory from '../helpers/listenerFactory';

import { executeOnFiles } from 'ts-cornucopia/file';
import type Action from './action';

export type DataType = Record<string, any>;

export type ClientSocket = ws & {
    userData: DataType
};

export type MessageObject = {
    path: string,
    data: DataType
};

export type onConnection = (socket: ClientSocket, req: IncomingMessage) => Promise<void>;

export type onAuth = (socket: ClientSocket, message: Buffer) => Promise<void>;
export type onAuthSuccess = (socket: ClientSocket, message: Buffer) => Promise<void>;
export type onAuthFailure = (socket: ClientSocket, error: Error, message: Buffer) => Promise<void>;

export type onMessage = (socket: ClientSocket, messageObject: MessageObject) => Promise<void>;

export type onClose = (socket: ClientSocket) => Promise<void>;
export type onError = (socket: ClientSocket, err: Error) => Promise<void>;

export type SocketOptions = {
    serverOptions?: ServerOptions
    url?: string
    port?: number,
    actionsPath?: string,
    actions?: Record<string, Action>,
    disableAuthentication?: boolean,
    onConnection?: onConnection,
    onAuth?: onAuth,
    onAuthSuccess?: onAuthSuccess,
    onAuthFailure?: onAuthFailure,
    onClose?: onClose,
    onError?: onError,
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

const onAuthSuccessDefault = async (socket: ClientSocket): Promise<void> => {
    socket.send('Authenticated');
};

const onAuthFailureDefault = async (socket: ClientSocket): Promise<void> => {
    socket.send('Failed Authentication');
};

const emptyPromiseFunction = async (): Promise<void> => {};

export default class Socket extends ws.Server {
    public readonly server: Server | undefined;

    private readonly onConnection: onConnection;
    private readonly onAuth: onAuth;
    private readonly onAuthSuccess: onAuthSuccess;
    private readonly onAuthFailure: onAuthFailure;
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
            actions,
            disableAuthentication,
            onConnection,
            onAuth,
            onAuthSuccess,
            onAuthFailure,
            onClose,
            onError,
            onMessage
        } = { ...defaultOptions, ...options };

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

            serverOptions.server = app.listen(port);
        }

        super(serverOptions);

        this.Actions = actions ?? {};

        if (actions !== undefined && actionsPath !== undefined && actionsPath !== './actions')
            console.warn('Actions and ActionPath supplied in the configuration, actionPath ignored.');

        if (actions === undefined) {
            const actionFiles = executeOnFiles(actionsPath, (file) => file, { recursive: true });

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
        }

        this.server = serverOptions.server;

        this.onConnection = onConnection ?? emptyPromiseFunction;
        this.onAuth = onAuth ?? authenticationNotImplemented;
        this.onAuthSuccess = onAuthSuccess ?? onAuthSuccessDefault;
        this.onAuthFailure = onAuthFailure ?? onAuthFailureDefault;
        this.onClose = onClose ?? emptyPromiseFunction;
        this.onError = onError ?? emptyPromiseFunction;
        this.onMessage = onMessage ?? emptyPromiseFunction;

        this.prepareAllActions().then(() => {
            this.on('connection', listenerFactory(this, null, this.connecting));
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

    private async authenticating (socket: ClientSocket, message: Buffer): Promise<void> {
        try {
            await this.onAuth(socket, message);

            if (socket.userData === undefined)
                socket.userData = {};

            if (socket.userData.id === undefined)
                socket.userData.id = uuid();
        } catch (err) {
            await this.onAuthFailure(socket, err as Error, message);

            return;
        }

        socket.removeAllListeners('message');

        socket.on('message', listenerFactory(this, socket, this.receivingMessage));

        await this.onAuthSuccess(socket, message);
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
