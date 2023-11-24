import WebSocket from 'ws';
import Socket from '../src/server/socket';

let socketServer: Socket | null = null;

beforeAll(() => {
    socketServer = new Socket({
        actionsPath: './mockActions',
        onAuth: async (socket, message) => {
            if (message.toString() !== 'trustMe!')
                throw new Error('Access Denied!');

            socket.send('Authenticated!');
        },
        onError: async (socket) => {
            socket.send('Failed!');
        }
    });
});

test('Testing server\'s connection opening...', (done) => {
    const con = new WebSocket('ws://localhost:3000');

    con.onopen = () => {
        con.close();

        done();
    };
});

test('Testing authentication failure and failure of action due to lack of authentication...', (done) => {
    const con = new WebSocket('ws://localhost:3000');

    con.onopen = () => {
        con.send('notTrusted');
    };

    let firstMessage = true;
    con.onmessage = (message) => {
        expect(message.data).toBe('Failed!');

        if (firstMessage) {
            firstMessage = false;

            con.send(JSON.stringify({
                path: 'hello',
                data: { name: 'World' }
            }));

            return;
        }

        con.close();

        done();
    };
});

test('Testing successful authentication and action execution...', (done) => {
    const con = new WebSocket('ws://localhost:3000');

    con.onopen = () => {
        con.send('trustMe!');
    };

    let firstMessage = true;
    con.onmessage = (message) => {
        if (firstMessage) {
            expect(message.data).toBe('Authenticated!');

            firstMessage = false;

            con.send(JSON.stringify({
                path: 'hello',
                data: { name: 'World' }
            }));

            return;
        }

        expect(message.data).toBe('Hello World!');

        con.close();

        done();
    };
});

afterAll(() => {
    socketServer?.close();
});
