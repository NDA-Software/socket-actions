import WebSocket from 'ws';
import Socket from '../src/server/socket';

let socketServer: Socket | null = null;
let connectionCounter = 0;

beforeAll(() => {
    socketServer = new Socket({
        actionsPath: './mockActions',
        onConnection: async () => {
            connectionCounter++;
        },
        onAuth: async (socket, message) => {
            if (message.toString() !== 'trustMe!')
                throw new Error('Access Denied!');

            socket.send('Authenticated!');
        },
        onError: async (socket, err) => {
            socket.send(err.message);
        }
    });
});

describe('Socket:', () => {
    test('Testing onConnection...', (done) => {
        const con = new WebSocket('ws://localhost:3000');

        con.onopen = () => {
            expect(connectionCounter).toBe(1);

            con.close();

            done();
        };
    });

    test('Testing onAuth...', (done) => {
        const con = new WebSocket('ws://localhost:3000');

        con.onopen = () => {
            con.send('notTrusted');
        };

        let messageCounter: number = 0;
        con.onmessage = (message) => {
            switch (messageCounter) {
                case 0: // Expected failure of authentication.
                    expect(message.data).toBe('Access Denied!');

                    con.send(JSON.stringify({
                        path: 'hello',
                        data: { name: 'World' }
                    }));
                    break;

                case 1: // Expected failure of action due to lack of previous authentication.
                    expect(message.data).toBe('Access Denied!');

                    con.send('trustMe!');
                    break;

                case 2: // Expect authentication success.
                    expect(message.data).toBe('Authenticated!');

                    con.send(JSON.stringify({
                        path: 'hello',
                        data: { name: 'World' }
                    }));
                    break;

                case 3: // Expect action to be executed.
                    expect(message.data).toBe('Hello World!');

                    con.close();
                    done();
                    break;
            }

            messageCounter++;
        };
    });
});

afterAll(() => {
    socketServer?.close();
});
