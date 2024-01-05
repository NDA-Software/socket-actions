import WebSocket from 'ws';

import listenerFactory, { type FactoryFunction } from './helpers/listenerFactory';

export type messageReceiver = (message: MessageEvent) => Promise<void>;

export type clientOptions = {
    authentication?: any,
    protocols?: string | string[],
    onMessage?: messageReceiver,
    onAuthSuccess?: messageReceiver,
    onAuthFailure?: messageReceiver,
}

export default class Client extends WebSocket {
    readonly auth: any;

    private readonly onAuthResponse: FactoryFunction;

    private readonly onMessageResponse: FactoryFunction;

    private readonly onMessage: messageReceiver | undefined;

    private readonly onAuthSuccess: messageReceiver | undefined;

    private readonly onAuthFailure: messageReceiver | undefined;

    private _isAuthenticated = false;

    constructor(url: string, options: clientOptions = {}) {
        super(url, options.protocols);

        let { authentication: auth } = options;

        if (auth !== undefined && typeof auth === 'object')
            auth = JSON.stringify(auth);

        this.auth = auth;

        this.onAuthResponse = listenerFactory(this, null, this.authResponse);
        this.onMessageResponse = listenerFactory(this, null, this.messageResponse);

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
        this.onmessage = this.onMessageResponse;
    }

    private async authResponse({ data }: MessageEvent): Promise<void> {
        const message = data;

        this.removeEventListener('message', this.onAuthResponse);

        if (message !== 'Authenticated') {
            if (this.onAuthFailure !== undefined)
                await this.onAuthFailure(message);

            return;
        }

        this._isAuthenticated = true;

        if (this.onAuthSuccess !== undefined)
            await this.onAuthSuccess(message);

        this.enableMessageReceiver();
    }

    private async messageResponse(message: MessageEvent): Promise<void> {
        try {
            message = JSON.parse(message.data);
        } catch (err) {
            // Not a JSON.
        }

        if (this.onMessage !== undefined)
            await this.onMessage(message);
    }

    public get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public async tryAuth(): Promise<void> {
        this.send(this.auth);

        this.onmessage = this.onAuthResponse;
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
