import Action, {
  type ActionParameters,
  type OnRunParameters,
} from "../../src/server/action.ts";

export default class Mistake extends Action {
  override onRun(_params: OnRunParameters) {
    throw new Error("You were defeated.");
  }

  protected override onError(
    _parameters: ActionParameters,
    err: unknown,
  ): Promise<void> {
    throw err;
  }
}
