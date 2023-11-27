import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class Mistake extends Action {
    override async onRun(_params: ActionParameters): Promise<void> {
        throw new Error('You were defeated.');
    }

    protected override async onError(_parameters: ActionParameters, err: unknown): Promise<void> {
        throw err;
    }
};
