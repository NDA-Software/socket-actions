import Client from '../src/client';

import { Socket, type onError as onErrorType, type onAuth as onAuthType } from '../src';

import ShootLightning from '../mockActions/shootLightning';
import Hello from '../mockActions/hello';

const actions = {
    shootLightning: new ShootLightning(),
    hello: new Hello()
};

let socketServer: Socket | null = null;

const onAuth: onAuthType = async (_, data) => {
    if (data.toString() !== '12345')
        throw new Error('Invalid login!');
};

const onError: onErrorType = async (socket) => {
    socket.send('oi');
};

beforeAll(() => {
    socketServer = new Socket({
        actions,
        port: 3003,
        onAuth,
        onError
    });
});

describe('Client:', () => {
    test('Testing authentication...', (done) => {
        let count = 0;

        const onOpen = async (): Promise<void> => {
            count++;
        };

        const onMessage = async ({ data: message }: MessageEvent): Promise<void> => {
            switch (count) {
                case 1:
                    expect(message).toBe('Failed Authentication');

                    con1.sendAction('shootLightning');

                    break;

                case 2:
                    expect(message).toBe('I am firing my lazer! DAAAAAAAAAAAAAAAH!');

                    con2.sendAction('shootLightning');
                    break;

                case 3:
                    expect(message).toBe('Failed Authentication');

                    expect(con1.isAuthenticated).toBe(true);
                    expect(con2.isAuthenticated).toBe(false);

                    con1.close();
                    con2.close();

                    done();
                    break;
            }

            count++;
        };

        const defaultOptions = {
            onOpen, onMessage, onAuthFailure: onMessage
        };

        const con1 = new Client({ url: 'ws://localhost:3003', authentication: '12345', ...defaultOptions });
        const con2 = new Client({ url: 'ws://localhost:3003', authentication: '67890', ...defaultOptions });
    });

    test('Testing sendAction...', (done) => {
        const onOpen = async (): Promise<void> => {
            con.sendAction('hello', { name: 'Test' });
        };

        const onMessage = async (message: MessageEvent): Promise<void> => {
            expect(message.data).toBe('Hello Test!');

            con.close();

            done();
        };

        const con = new Client({
            url: 'ws://localhost:3003',
            authentication: '12345',
            onMessage,
            onOpen
        });
    });
});

afterAll(() => {
    socketServer?.close();
});
