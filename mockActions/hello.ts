import { type ActionParameters } from '../src';
import Action from '../src/server/action';

module.exports = class Hello extends Action {
    override async onRun(data: ActionParameters): Promise<void> {
        console.log(data);
        console.log('Hello World!');
    }
};
