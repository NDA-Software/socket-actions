import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class Hello extends Action {
  override onRun(params: OnRunParameters) {
    const { respond, data } = params;

    respond({ message: `Hello ${data.name}!` });
  }
}
