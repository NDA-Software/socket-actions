import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class TestUserData extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, userData } = params;

        const { id } = userData;

        socket.send(`User Id: ${id}`);
    }
};
