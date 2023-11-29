import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class GetId extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket } = params;

        socket.send(socket.userData.id);
    }
};
