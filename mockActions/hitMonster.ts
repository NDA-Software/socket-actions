import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class HitMonster extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        params.socket.send('ONE PUNCH!');
    }
};
