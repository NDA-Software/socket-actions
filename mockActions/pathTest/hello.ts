import Action, { type ActionParameters } from '../../src/server/action';

module.exports = class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket } = params;

        socket.send('Hello from module.exports!');
    }
};
