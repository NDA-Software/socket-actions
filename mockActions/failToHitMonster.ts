import Action from '../src/server/action';

export default class FailToHitMonster extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        params.socket.send("You missed! Please wait for the bald guy's help.");
    }
};
