import type Socket from './socket';
import { type DataType, type ClientSocket } from './socket';

export type ActionParameters = {
    socket: ClientSocket
    userData: DataType,
    data: DataType,
}

export default abstract class Action {
    protected server: Socket | null = null;

    async prepareAction (server: Socket): Promise<void> {
        this.server = server;
    }

    protected async onCheckPermissions (_parameters: ActionParameters): Promise<void> {}

    protected async onError (_parameters: ActionParameters, err: unknown): Promise<void> {
        console.error(err);
    }

    async run (parameters: ActionParameters): Promise<void> {
        try {
            await this.onCheckPermissions(parameters);

            await this.onRun(parameters);
        } catch (err) {
            await this.onError(parameters, err);
        }
    };

    abstract onRun (data: ActionParameters): Promise<void>;
};
