import Action, { type OnRunParameters } from "../src/server/action";

export default class TestCommunication extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        const { data } = params;

        const { toId, message } = data;

        this.server?.sendMessageById(toId, message);
    }
}
