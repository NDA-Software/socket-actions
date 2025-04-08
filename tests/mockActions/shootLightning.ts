import Action, {
  type ActionParameters,
  type OnRunParameters,
} from "../../src/server/action.ts";

export default class ShootLightning extends Action {
  protected override onCheckPermissions(
    _parameters: ActionParameters,
  ) {
    const { userData } = _parameters;

    if (userData.swordColor === "green") {
      throw new Error("You cannot do that.");
    }
  }

  protected override onError(
    _parameters: ActionParameters,
    err: Error,
  ) {
    _parameters.socket.send(err.message);
  }

  public returnMessage = "";
  override onRun(_data: OnRunParameters) {
    _data.respond({ message: "I am firing my lazer! DAAAAAAAAAAAAAAAH!" });
  }
}
