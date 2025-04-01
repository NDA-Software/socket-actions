import Action, { type ActionParameters } from "../src/server/action";

export default class GetId extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket } = params;

        socket.send(socket.userData.id);
    }
}
