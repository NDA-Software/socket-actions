import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class TestCommunication extends Action {
  override onRun(params: OnRunParameters) {
    const { data } = params;

    const { toId, message } = data;

    this.server?.sendMessageById(toId, message);
  }
}
