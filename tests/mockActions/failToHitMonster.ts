import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class FailToHitMonster extends Action {
  override onRun(params: OnRunParameters) {
    params.respond({
      message: "You missed! Please wait for the bald guy's help.",
    });
  }
}
