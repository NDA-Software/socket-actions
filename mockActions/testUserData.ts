import Action, { type ActionParameters } from '../src/server/action';

export default class TestUserData extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, userData } = params;

        const { id } = userData;

        socket.send(`User Id: ${id}`);
    }
};
