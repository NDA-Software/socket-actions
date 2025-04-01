import type Socket from "./socket";
import { type ClientSocket, type DataType } from "./socket";

export type ActionParameters = {
    socket: ClientSocket;
    userData: DataType;
    requestId: string | undefined;
    data: DataType;
};

export type OnRunParameters = {
    socket: ClientSocket;
    userData: DataType;
    data: DataType;
    respond: (data: DataType) => void;
};

export default abstract class Action {
    protected server: Socket | null = null;

    async prepareAction(server: Socket): Promise<void> {
        this.server = server;
    }

    protected async onCheckPermissions(
        _parameters: ActionParameters,
    ): Promise<void> {}

    protected async onError(
        _parameters: ActionParameters,
        err: unknown,
    ): Promise<void> {
        console.error(err);
    }

    async run(parameters: ActionParameters): Promise<void> {
        try {
            await this.onCheckPermissions(parameters);

            const { socket, requestId } = parameters;

            const respond = (data: DataType) =>
                socket.send(JSON.stringify({ requestId, data }));

            await this.onRun({ ...parameters, respond });
        } catch (err) {
            await this.onError(parameters, err);
        }
    }

    abstract onRun(data: OnRunParameters): Promise<void>;
}
