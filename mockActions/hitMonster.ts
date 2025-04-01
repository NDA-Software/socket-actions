import Action, { type OnRunParameters } from "../src/server/action";

export default class HitMonster extends Action {
    override async onRun(params: OnRunParameters): Promise<void> {
        params.respond({ message: "ONE PUNCH!" });
    }
}
