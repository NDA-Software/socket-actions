import Action, { type ActionParameters } from "../src/server/action";

export default class TestCommunication extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { data } = params;

        const { toId, message } = data;

        this.server?.sendMessageById(toId, message);
    }
}
