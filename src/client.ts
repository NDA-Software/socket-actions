import WebSocket from 'ws';

import listenerFactory, { type FactoryFunction } from './helpers/listenerFactory';

export type messageReceiver = (message: MessageEvent) => Promise<void>;

export type clientOptions = {
    authentication?: any,
    protocols?: string | string[],
    onMessage?: messageReceiver,
    onAuthResponse?: messageReceiver,
    onAuthSuccess?: messageReceiver,
    onAuthFailure?: messageReceiver,
}

const defaultOnAuthResponse = async ({ data }: MessageEvent): Promise<void> => {
    if (data !== 'Authenticated')
        throw new Error(data);
};

export default class Client extends WebSocket {
    readonly auth: any;

    private readonly preparedOnAuthResponse: FactoryFunction;

    private readonly preparedOnMessageResponse: FactoryFunction;

    private readonly onMessage: messageReceiver | undefined;

    private readonly onAuthResponse: messageReceiver | undefined;

    private readonly onAuthSuccess: messageReceiver | undefined;

    private readonly onAuthFailure: messageReceiver | undefined;

    private _isAuthenticated = false;

    constructor(url: string, options: clientOptions = {}) {
        super(url, options.protocols);

        let { authentication: auth } = options;

        if (auth !== undefined && typeof auth === 'object')
            auth = JSON.stringify(auth);

        this.auth = auth;

        this.preparedOnAuthResponse = listenerFactory(this, null, this.authResponse);
        this.preparedOnMessageResponse = listenerFactory(this, null, this.messageResponse);

        this.onAuthResponse = options.onAuthResponse ?? defaultOnAuthResponse;
        this.onAuthSuccess = options.onAuthSuccess;
        this.onAuthFailure = options.onAuthFailure;
        this.onMessage = options.onMessage;

        this.onopen = listenerFactory(this, null, this.onOpen);
    }

    private async onOpen(): Promise<void> {
        const { auth } = this;

        if (auth !== undefined)
            await this.tryAuth();
        else
            this.enableMessageReceiver();
    }

    private enableMessageReceiver (): void {
        this.onmessage = this.preparedOnMessageResponse;
    }

    private async authResponse(message: MessageEvent): Promise<void> {
        this.removeEventListener('message', this.preparedOnAuthResponse);

        try {
            if (this.onAuthResponse !== undefined)
                await this.onAuthResponse(message);

            this._isAuthenticated = true;

            if (this.onAuthSuccess !== undefined)
                await this.onAuthSuccess(message);

            this.enableMessageReceiver();
        } catch (err) {
            if (this.onAuthFailure !== undefined)
                await this.onAuthFailure(message);
        }
    }

    private async messageResponse(message: MessageEvent): Promise<void> {
        if (this.onMessage !== undefined)
            await this.onMessage(message);
    }

    public get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public async tryAuth(): Promise<void> {
        this.send(this.auth);

        this.onmessage = this.preparedOnAuthResponse;
    }

    public sendAction(path: string, data?: Record<string, any>): void {
        const messageObj: any = {
            path
        };

        if (data !== undefined)
            messageObj.data = data;

        const message = JSON.stringify(messageObj);

        this.send(message);
    }
}
