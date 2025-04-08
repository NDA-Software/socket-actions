import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class SetId extends Action {
  override onRun(params: OnRunParameters) {
    const { data, respond, userData } = params;

    userData.id = data.id;

    respond({ message: "Ok" });
  }
}
