import { Socket, type onAuth as onAuthType } from '../src';

import ShootLightning from '../mockActions/shootLightning';
import Client from '../src/client';

const actions = {
    shootLightning: new ShootLightning()
};

let socketServer: Socket | null = null;

let firstConnection = true;
const onAuth: onAuthType = async (socket) => {
    socket.userData = {
        swordColor: firstConnection ? 'green' : 'red'
    };

    firstConnection = false;
};

beforeAll(() => {
    socketServer = new Socket({
        actions,
        port: 3002,
        onAuth
    });
});

describe('Action:', () => {
    test('Testing permissions...', (done) => {
        let messageCounter: number = 0;

        const onOpen = async (): Promise<void> => {
            if (messageCounter === 1) // Both Connected
                con1.sendAction('shootLightning');

            messageCounter++;
        };

        const onMessage = async ({ data: message }: any): Promise<void> => {
            switch (messageCounter) {
                case 2: // Expecting failure due to permissions in Connection 1
                    expect(message).toBe('You cannot do that.');

                    con2.sendAction('shootLightning');
                    break;

                case 3: // Expecting success in Connection 2
                    expect(message).toBe('I am firing my lazer! DAAAAAAAAAAAAAAAH!');

                    con1.close();
                    con2.close();

                    done();
                    break;
            }

            messageCounter++;
        };

        const con1 = new Client({ authentication: 'hey', url: 'ws://localhost:3002', onOpen, onMessage });
        const con2 = new Client({ authentication: 'hey', url: 'ws://localhost:3002', onOpen, onMessage });
    });
});

afterAll(() => {
    socketServer?.close();
});
