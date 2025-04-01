import Action, { type ActionParameters } from "../src/server/action";

export default class HitMonster extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        params.socket.send("ONE PUNCH!");
    }
}
