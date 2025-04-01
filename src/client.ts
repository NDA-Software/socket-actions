import listenerFactory, {
    type FactoryFunction,
} from "./helpers/listenerFactory";

export type onOpen = () => Promise<void>;
export type onClose = () => Promise<void>;
export type messageReceiver = (message: MessageEvent) => Promise<void>;

export type clientOptions = {
    url?: string;
    authentication?: any;
    connectionTryLimit?: number;
    secondsBetweenRetries?: number;
    protocols?: string | string[];
    onOpen?: onOpen;
    onClose?: onClose;
    onMessage?: messageReceiver;
    onAuthResponse?: messageReceiver;
    onAuthFailure?: messageReceiver;
};

const defaultOnAuthResponse = async ({ data }: MessageEvent): Promise<void> => {
    if (data !== "Authenticated") {
        throw new Error(data);
    }
};

const defaultOptions = {
    url: "ws://localhost:3000",
    connectionTryLimit: 0,
    secondsBetweenRetries: 5,
};

export default class Client {
    private _authentication: any;
    private _socket: WebSocket | null = null;

    private readonly url: string;
    private readonly protocols: string | string[] | undefined;

    private readonly preparedOnAuthResponse: FactoryFunction;
    private readonly preparedOnMessageResponse: FactoryFunction;

    private readonly onMessage: messageReceiver | undefined;
    private readonly onAuthResponse: messageReceiver | undefined;
    private readonly onOpen: onOpen | undefined;
    private readonly onClose: onClose | undefined;
    private readonly onAuthFailure: messageReceiver | undefined;

    private connectionTries = 0;
    private readonly connectionTryLimit: number;
    private readonly secondsBetweenRetries: number;

    private _isAuthenticated = false;
    private _isConnected = false;

    constructor(options: clientOptions = {}) {
        this.connectionTryLimit = options.connectionTryLimit ??
            defaultOptions.secondsBetweenRetries;
        this.secondsBetweenRetries = options.secondsBetweenRetries ??
            defaultOptions.secondsBetweenRetries;

        let { authentication } = options;

        if (
            authentication !== undefined && typeof authentication === "object"
        ) {
            authentication = JSON.stringify(authentication);
        }

        this._authentication = authentication;

        this.preparedOnAuthResponse = listenerFactory(
            this,
            null,
            this.authResponse,
        );
        this.preparedOnMessageResponse = listenerFactory(
            this,
            null,
            this.messageResponse,
        );

        this.onAuthResponse = options.onAuthResponse ?? defaultOnAuthResponse;
        this.onOpen = options.onOpen;
        this.onClose = options.onClose;
        this.onAuthFailure = options.onAuthFailure;
        this.onMessage = options.onMessage;

        this.url = options.url ?? defaultOptions.url;
        this.protocols = options.protocols;

        this.connect();
    }

    private connect(): void {
        this._socket = new WebSocket(this.url, this.protocols);

        this._socket.addEventListener(
            "open",
            listenerFactory(this, null, this.opening),
        );
        this._socket.addEventListener(
            "close",
            listenerFactory(this, null, this.closing),
        );
    }

    public reconnect(): void {
        if (this._isConnected) {
            this.close();
        }

        this.connect();
    }

    private async opening(): Promise<void> {
        const { _authentication: authentication } = this;

        if (authentication !== undefined) {
            this._socket?.addEventListener(
                "message",
                this.preparedOnAuthResponse,
            );

            this.tryAuth();

            return;
        }

        if (this.onOpen !== undefined) {
            await this.onOpen();
        }

        this.enableMessageReceiver();

        this._isConnected = true;
        this.connectionTries = 0;
    }

    private async closing(): Promise<void> {
        this._isConnected = false;
        this._isAuthenticated = false;

        if (this.connectionTries < this.connectionTryLimit) {
            this.connectionTries++;

            console.log(
                `Connection to server lost. Reconnecting in ${this.secondsBetweenRetries} seconds...`,
            );
            console.log(
                `(Attempt ${this.connectionTries} of ${this.connectionTryLimit})`,
            );

            setTimeout(() => {
                this.reconnect();
            }, this.secondsBetweenRetries * 1000);

            return;
        }

        if (this.onClose !== undefined) {
            await this.onClose();
        }
    }

    public close(code?: number | undefined, reason?: string | undefined): void {
        this.connectionTries = this.connectionTryLimit;

        this._socket?.close(code, reason);
    }

    private enableMessageReceiver(): void {
        this._socket?.addEventListener(
            "message",
            this.preparedOnMessageResponse,
        );
    }

    private async authResponse(message: MessageEvent): Promise<void> {
        try {
            if (this.onAuthResponse !== undefined) {
                await this.onAuthResponse(message);
            }

            this._isAuthenticated = true;

            if (this.onOpen !== undefined) {
                await this.onOpen();
            }

            this._socket?.removeEventListener(
                "message",
                this.preparedOnAuthResponse,
            );

            this.enableMessageReceiver();
        } catch (err) {
            if (this.onAuthFailure !== undefined) {
                await this.onAuthFailure(message);
            }
        }
    }

    private async messageResponse(message: MessageEvent): Promise<void> {
        if (this.onMessage !== undefined) {
            await this.onMessage(message);
        }
    }

    public get authentication(): any {
        return this._authentication;
    }

    public get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public get isConnected(): boolean {
        return this._isConnected;
    }

    public get socket(): WebSocket | null {
        return this._socket;
    }

    public tryAuth(authentication?: any): void {
        if (this.isAuthenticated) {
            console.warn("Already logged in. Execution of tryAuth blocked.");

            return;
        }

        if (authentication !== undefined) {
            this._authentication = authentication;
        }

        this._socket?.send(this._authentication);
    }

    public sendAction(path: string, data?: Record<string, any>): void {
        const messageObj: any = {
            path,
        };

        if (data !== undefined) {
            messageObj.data = data;
        }

        const message = JSON.stringify(messageObj);

        this._socket?.send(message);
    }
}
