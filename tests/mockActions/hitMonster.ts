import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class HitMonster extends Action {
  override onRun(params: OnRunParameters) {
    params.respond({ message: "ONE PUNCH!" });
  }
}
