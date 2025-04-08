import Action, { type OnRunParameters } from "../../../src/server/action.ts";

export default class Hello extends Action {
  override onRun(params: OnRunParameters) {
    const { respond } = params;

    respond({ message: "Hello from dynamic import!" });
  }
}
