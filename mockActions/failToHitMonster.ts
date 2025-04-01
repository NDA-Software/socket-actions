import Action, { type OnRunParameters } from "../src/server/action";

export default class FailToHitMonster extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        params.respond({
            message: "You missed! Please wait for the bald guy's help.",
        });
    }
}
