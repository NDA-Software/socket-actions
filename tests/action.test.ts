import WebSocket from 'ws';

import Socket, { type onAuth as onAuthType } from '../src/server/socket';

import ShootLightning from '../mockActions/shootLightning';

const actions = {
    shootLightning: new ShootLightning()
};

const connect = (): WebSocket => new WebSocket('ws://localhost:3002');

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
        const con1 = connect();
        const con2 = connect();

        con1.onopen = () => {
            con1.send('hey');
        };

        con2.onopen = () => {
            con2.send('hey');
        };

        let messageCounter: number = 0;

        const onMessage = ({ data: message }: any): void => {
            switch (messageCounter) {
                case 0: // Connection 1
                    expect(message).toBe('Authenticated');

                    con2.send('hey');
                    break;

                case 1: // Connection 2
                    expect(message).toBe('Authenticated');

                    con1.send(JSON.stringify({
                        path: 'shootLightning',
                        data: {}
                    }));
                    break;

                case 2: // Expecting failure due to permissions in Connection 1
                    expect(message).toBe('You cannot do that.');

                    con2.send(JSON.stringify({
                        path: 'shootLightning',
                        data: {}
                    }));
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

        con1.onmessage = onMessage;

        con2.onmessage = onMessage;
    });
});

afterAll(() => {
    socketServer?.close();
});
