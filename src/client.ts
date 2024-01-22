import listenerFactory, { type FactoryFunction } from './helpers/listenerFactory';

export type onOpen = () => Promise<void>;
export type messageReceiver = (message: MessageEvent) => Promise<void>;

export type clientOptions = {
    url?: string,
    authentication?: any,
    protocols?: string | string[],
    onOpen?: onOpen,
    onMessage?: messageReceiver,
    onAuthResponse?: messageReceiver,
    onAuthFailure?: messageReceiver,
}

const defaultOnAuthResponse = async ({ data }: MessageEvent): Promise<void> => {
    if (data !== 'Authenticated')
        throw new Error(data);
};

const defaultOptions = {
    url: 'ws://localhost:3000'
};

export default class Client extends WebSocket {
    private _authentication: any;

    private readonly preparedOnAuthResponse: FactoryFunction;

    private readonly preparedOnMessageResponse: FactoryFunction;

    private readonly onMessage: messageReceiver | undefined;

    private readonly onAuthResponse: messageReceiver | undefined;

    private readonly onOpen: onOpen | undefined;

    private readonly onAuthFailure: messageReceiver | undefined;

    private _isAuthenticated = false;

    constructor(options: clientOptions = {}) {
        super(options.url ?? defaultOptions.url, options.protocols);

        let { authentication } = options;

        if (authentication !== undefined && typeof authentication === 'object')
            authentication = JSON.stringify(authentication);

        this._authentication = authentication;

        this.preparedOnAuthResponse = listenerFactory(this, null, this.authResponse);
        this.preparedOnMessageResponse = listenerFactory(this, null, this.messageResponse);

        this.onAuthResponse = options.onAuthResponse ?? defaultOnAuthResponse;
        this.onOpen = options.onOpen;
        this.onAuthFailure = options.onAuthFailure;
        this.onMessage = options.onMessage;

        this.addEventListener('open', listenerFactory(this, null, this.open));
    }

    private async open(): Promise<void> {
        const { _authentication: authentication } = this;

        if (authentication !== undefined) {
            this.addEventListener('message', this.preparedOnAuthResponse);

            this.tryAuth();

            return;
        }

        if (this.onOpen !== undefined)
            await this.onOpen();

        this.enableMessageReceiver();
    }

    private enableMessageReceiver (): void {
        this.addEventListener('message', this.preparedOnMessageResponse);
    }

    private async authResponse(message: MessageEvent): Promise<void> {
        try {
            if (this.onAuthResponse !== undefined)
                await this.onAuthResponse(message);

            this._isAuthenticated = true;

            if (this.onOpen !== undefined)
                await this.onOpen();

            this.removeEventListener('message', this.preparedOnAuthResponse);

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

    public get authentication(): any {
        return this._authentication;
    }

    public get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public tryAuth(authentication?: any): void {
        if (this.isAuthenticated) {
            console.warn('Already logged in. Execution of tryAuth blocked.');

            return;
        }

        if (authentication !== undefined)
            this._authentication = authentication;

        this.send(this._authentication);
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
