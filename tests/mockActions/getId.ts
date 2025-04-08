import Action, { type OnRunParameters } from "../../src/server/action.ts";

export default class GetId extends Action {
  override onRun(params: OnRunParameters) {
    const { socket, respond } = params;

    respond({ id: socket.userData.id });
  }
}
