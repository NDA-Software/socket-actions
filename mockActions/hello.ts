import Action, { type ActionParameters } from "../src/server/action";

export default class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, data } = params;

        socket.send(`Hello ${data.name}!`);
    }
}
