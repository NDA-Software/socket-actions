import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class TestUserData extends Action {
  override onRun(params: OnRunParameters) {
    const { respond, userData } = params;

    const { id } = userData;

    respond({ message: `User Id: ${id}` });
  }
}
