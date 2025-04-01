import Action, { type OnRunParameters } from "../src/server/action";

export default class TestUserData extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        const { respond, userData } = params;

        const { id } = userData;

        respond({ message: `User Id: ${id}` });
    }
}
