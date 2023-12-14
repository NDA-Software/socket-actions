import { Action, type ActionParameters } from '../src';

export default class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, data } = params;

        socket.send(`Hello ${data.name}!`);
    }
};
