import Action, { type ActionParameters } from '../src/server/action';

export default class SetId extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { data, socket, userData } = params;

        userData.id = data.id;

        socket.send('Ok');
    }
};
