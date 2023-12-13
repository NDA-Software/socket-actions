import { Action, type ActionParameters } from '../src';

module.exports = class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, data } = params;

        socket.send(`Hello ${data.name}!`);
    }
};
