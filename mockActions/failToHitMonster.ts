import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class FailToHitMonster extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        params.socket.send("You missed! Please wait for the bald guy's help.");
    }
};
