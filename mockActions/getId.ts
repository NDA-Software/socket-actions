import Action, { type OnRunParameters } from "../src/server/action";

export default class GetId extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        const { socket, respond } = params;

        respond({ id: socket.userData.id });
    }
}
