import Action, {
    type ActionParameters,
    type OnRunParameters,
} from "../src/server/action";

export default class ShootLightning extends Action {
    protected override async onCheckPermissions(
        _parameters: ActionParameters,
    ): Promise<void> {
        const { userData } = _parameters;

        if (userData.swordColor === "green") {
            throw new Error("You cannot do that.");
        }
    }

    protected override async onError(
        _parameters: ActionParameters,
        err: Error,
    ): Promise<void> {
        _parameters.socket.send(err.message);
    }

    public returnMessage = "";
    override async onRun(_data: OnRunParameters): Promise<void> {
        _data.respond({ message: "I am firing my lazer! DAAAAAAAAAAAAAAAH!" });
    }
}
