import WebSocket from 'ws';
import Socket from '../src/server/socket';

let socket: Socket | null = null;

beforeAll(() => {
    socket = new Socket({ actionsPath: './mockActions' });
});

test('Testing server\'s connection opening...', (done) => {
    const con = new WebSocket('ws://localhost:3000');

    con.onopen = () => {
        con.close();

        done();
    };
});

afterAll(() => {
    socket?.close();
});
