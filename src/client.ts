import WebSocket from 'ws';

import listenerFactory, { type FactoryFunction } from './helpers/listenerFactory';

export type messageReceiver = (message: string) => Promise<void>;

export type clientOptions = {
    authentication?: any,
    protocols?: string | string[],
    onMessage?: messageReceiver,
    onAuthFailed?: messageReceiver,
}

export default class Client extends WebSocket {
    readonly auth: any;

    private readonly onAuthResponse: FactoryFunction;

    private readonly onMessageResponse: FactoryFunction;

    private readonly onMessage: messageReceiver | undefined;

    private readonly onAuthFailed: messageReceiver | undefined;

    private _isAuthenticated = false;

    constructor(url: string, options: clientOptions = {}) {
        super(url, options.protocols);

        let { authentication: auth } = options;

        if (auth !== undefined && typeof auth === 'object')
            auth = JSON.stringify(auth);

        this.auth = auth;

        this.onAuthResponse = listenerFactory(this, null, this.authResponse);
        this.onMessageResponse = listenerFactory(this, null, this.messageResponse);

        this.onAuthFailed = options.onAuthFailed;
        this.onMessage = options.onMessage;

        this.on('open', listenerFactory(this, null, this.onOpen));
    }

    private async onOpen(): Promise<void> {
        const { auth } = this;
        if (auth !== undefined)
            await this.tryAuth();
        else
            this.enableMessageReceiver();
    }

    private enableMessageReceiver (): void {
        this.on('message', this.onMessageResponse);
    }

    private async authResponse(message: string): Promise<void> {
        this.removeListener('message', this.onAuthResponse);

        if (message !== 'Authenticated') {
            if (this.onAuthFailed !== undefined)
                await this.onAuthFailed(message);

            return;
        }

        this._isAuthenticated = true;

        this.enableMessageReceiver();
    }

    private async messageResponse(message: string): Promise<void> {
        message = JSON.parse(message);

        if (this.onMessage !== undefined)
            await this.onMessage(message);
    }

    public get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public async tryAuth(): Promise<void> {
        this.send(this.auth);

        this.on('message', this.onAuthResponse);
    }

    public sendAction(path: string, data: Record<string, any>): void {
        const message = JSON.stringify({
            path,
            data
        });

        this.send(message);
    }
}
