import Action, { type OnRunParameters } from "../src/server/action";

export default class SetId extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        const { data, respond, userData } = params;

        userData.id = data.id;

        respond({ message: "Ok" });
    }
}
