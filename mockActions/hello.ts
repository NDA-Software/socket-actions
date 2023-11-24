import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, data } = params;

        socket.send(`Hello ${data.name}!`);
    }
};
