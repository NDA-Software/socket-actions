import Action, {
    type ActionParameters,
    type OnRunParameters,
} from "../src/server/action";

export default class Mistake extends Action {
    override async onRun(_params: OnRunParameters): Promise<void> {
        throw new Error("You were defeated.");
    }

    protected override async onError(
        _parameters: ActionParameters,
        err: unknown,
    ): Promise<void> {
        throw err;
    }
}
