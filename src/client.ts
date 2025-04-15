import { createHash } from "crypto";
import listenerFactory, {
    type FactoryFunction,
} from "./helpers/listenerFactory";

export type MessageObject = MessageEvent & {
    requestId?: string;
};

export type onOpen = () => Promise<void> | void;
export type onClose = () => Promise<void> | void;
export type messageReceiver = (message: MessageObject) => Promise<void> | void;

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

const defaultOnAuthResponse = (
    { data }: MessageObject,
): void => {
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

    private requests: Record<string, (message: MessageObject) => void> = {};

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
            this.tryAuth();

            return;
        }

        this._isConnected = true;
        this.enableMessageReceiver();

        if (this.onOpen !== undefined) {
            await this.onOpen();
        }

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
        this._isConnected = false;
        this._isAuthenticated = false;

        this.connectionTries = this.connectionTryLimit;

        this._socket?.close(code, reason);
    }

    private enableMessageReceiver(): void {
        this._socket?.addEventListener(
            "message",
            this.preparedOnMessageResponse,
        );
    }

    private disableMessageReceiver(): void {
        this._socket?.removeEventListener(
            "message",
            this.preparedOnMessageResponse,
        );
    }

    private async authResponse(message: MessageObject): Promise<void> {
        try {
            if (this.onAuthResponse !== undefined) {
                await this.onAuthResponse(message);
            }

            if (message.data === "Failed Authentication") {
                throw new Error(message.data);
            }

            this._isAuthenticated = true;

            this._socket?.removeEventListener(
                "message",
                this.preparedOnAuthResponse,
            );

            this.enableMessageReceiver();

            if (this.onOpen !== undefined) {
                await this.onOpen();
            }
        } catch (err) {
            if (this.onAuthFailure !== undefined) {
                await this.onAuthFailure(message);
            }
        }
    }

    private async messageResponse(message: MessageObject): Promise<void> {
        if (message.data.includes("requestId")) {
            try {
                const { requestId, data } = JSON.parse(message.data);

                if (requestId) {
                    const request = this.requests[requestId];

                    if (request) {
                        request(data);
                    }

                    return;
                }
            } catch (err) {
                // Invalid JSON.
            }
        }

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

        this.disableMessageReceiver();

        this._socket?.addEventListener(
            "message",
            this.preparedOnAuthResponse,
        );

        this._socket?.send(this._authentication);
    }

    public sendAction(
        path: string,
        data?: Record<string, any>,
        extraDetails: Record<string, any> = {},
    ): void {
        const messageObj: any = {
            ...extraDetails,
            path,
        };

        if (data !== undefined) {
            messageObj.data = data;
        }

        const message = JSON.stringify(messageObj);

        this._socket?.send(message);
    }

    public sendRequest(
        path: string,
        data?: Record<string, any>,
        timeout = 5000,
    ): Promise<Record<string, any>> {
        const requestId = createHash("md5").update(Date.now().toString())
            .digest("hex");

        return new Promise((resolve, reject) => {
            let resolved = false;

            let timeoutHolder: number;

            this.requests[requestId] = (message: MessageObject): void => {
                resolved = true;

                delete this.requests[requestId];
                clearTimeout(timeoutHolder);

                resolve(message);
            };

            timeoutHolder = setTimeout(() => {
                if (resolved) {
                    return;
                }

                delete this.requests[requestId];

                reject(new Error("Request timed out."));
            }, timeout) as unknown as number;

            this.sendAction(path, data, {
                requestId,
            });
        });
    }
}
