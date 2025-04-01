import Action, { type OnRunParameters } from "../src/server/action";

export default class Hello extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        const { respond, data } = params;

        respond({ message: `Hello ${data.name}!` });
    }
}
