import WebSocket from 'ws';
import { validate as uuidValidate } from 'uuid';

import Socket, {
    type onAuth as onAuthType,
    type onError as onErrorType,
    type onMessage as onMessageType
} from '../src/server/socket';

import { type Action } from '../src/server';

import FailToHitMonster from '../mockActions/failToHitMonster';
import GetId from '../mockActions/getId';
import Hello from '../mockActions/hello';
import HitMonster from '../mockActions/hitMonster';
import Mistake from '../mockActions/mistake';
import SetId from '../mockActions/setId';
import TestCommunication from '../mockActions/testCommunication';
import TestUserData from '../mockActions/testUserData';

const actions: Record<string, Action> = {
    failToHitMonster: new FailToHitMonster(),
    getId: new GetId(),
    hello: new Hello(),
    hitMonster: new HitMonster(),
    mistake: new Mistake(),
    setId: new SetId(),
    testCommunication: new TestCommunication(),
    testUserData: new TestUserData()
};

let unsafeSocket: Socket | null = null;
let socketServer: Socket | null = null;

let connectionCounter = 0;

const connect = (): WebSocket => new WebSocket('ws://localhost:3000');

const onConnection = async (): Promise<void> => {
    connectionCounter++;
};

const onAuth: onAuthType = async (_, message) => {
    if (message.toString() !== 'trustMe!')
        throw new Error('Access Denied!');
};

let firstHit = true;
const onMessage: onMessageType = async (_socket, messageObject) => {
    if (messageObject.path === 'hitMonster' && firstHit) {
        messageObject.path = 'failToHitMonster';

        firstHit = false;
    }
};

const onClose = async (): Promise<void> => {
    connectionCounter--;
};

const onError: onErrorType = async (socket, err) => {
    socket.send(err.message);
};

beforeAll(() => {
    socketServer = new Socket({
        actions,
        onConnection,
        onAuth,
        onMessage,
        onClose,
        onError
    });

    unsafeSocket = new Socket({
        actionsPath: './mockActions/pathTest',
        disableAuthentication: true,
        port: 3001
    });
});

describe('Socket:', () => {
    test('Testing onConnection...', (done) => {
        const con = connect();

        con.onopen = () => {
            expect(connectionCounter).toBe(1);

            con.close();

            done();
        };
    });

    test('Testing onAuth...', (done) => {
        const con = connect();

        con.onopen = () => {
            con.send('notTrusted');
        };

        let messageCounter: number = 0;
        con.onmessage = (message) => {
            switch (messageCounter) {
                case 0: // Expected failure of authentication.
                    expect(message.data).toBe('Failed Authentication');

                    con.send(JSON.stringify({
                        path: 'hello',
                        data: { name: 'World' }
                    }));
                    break;

                case 1: // Expected failure of action due to lack of previous authentication.
                    expect(message.data).toBe('Failed Authentication');

                    con.send('trustMe!');
                    break;

                case 2: // Expect authentication success.
                    expect(message.data).toBe('Authenticated');

                    con.send(JSON.stringify({
                        path: 'hello',
                        data: { name: 'World' }
                    }));
                    break;

                case 3: // Expect action to be executed.
                    expect(message.data).toBe('Hello World!');

                    con.send(JSON.stringify({
                        path: 'getId'
                    }));
                    break;

                case 4:
                    expect(
                        uuidValidate(message.data as string)
                    ).toBe(true);

                    con.close();
                    done();
                    break;
            }

            messageCounter++;
        };
    });

    test('Testing onMessage...', (done) => {
        const con = connect();

        con.onopen = () => {
            con.send('trustMe!');
        };

        let messageCounter: number = 0;
        con.onmessage = (message) => {
            switch (messageCounter) {
                case 0:
                    con.send(JSON.stringify({ path: 'hitMonster' }));
                    break;

                case 1: // Expect for attack to have failed.
                    expect(message.data).toBe('You missed! Please wait for the bald guy\'s help.');

                    con.send(JSON.stringify({ path: 'hitMonster' }));
                    break;

                case 2: // Expect action to be executed.
                    expect(message.data).toBe('ONE PUNCH!');

                    con.close();
                    done();
                    break;
            }

            messageCounter++;
        };
    });

    test('Testing onError...', (done) => {
        const con = connect();

        con.onopen = () => {
            con.send('trustMe!');
        };

        let firstMessage = true;
        con.onmessage = (message) => {
            if (firstMessage) {
                firstMessage = false;

                con.send(JSON.stringify({
                    path: 'mistake'
                }));

                return;
            }

            con.close();

            expect(message.data).toBe('You were defeated.');

            done();
        };
    });

    test('Testing onClose...', (done) => {
        // This required a timeout since onClose is async and therefore will not be waited when socket is closed.

        setTimeout(() => {
            expect(connectionCounter).toBe(0);

            done();
        }, 20);
    });

    test('Testing unsafe socket and actionsPath...', (done) => {
        const con = new WebSocket('ws://localhost:3001');

        con.onopen = () => {
            con.send(JSON.stringify({
                path: 'hello'

            }));
        };

        con.onmessage = (message) => {
            expect(message.data).toBe('Hello from module.exports!');

            con.close();

            done();
        };
    });

    test('Testing messaging between clients through actions...', (done) => {
        const con = connect();
        const con2 = connect();

        con.onopen = () => {
            con.send('trustMe!');
        };

        con2.onopen = () => {
            con2.send('trustMe!');
        };

        let con1Counter = 0;
        con.onmessage = ({ data }) => {
            switch (con1Counter) {
                case 0:
                    con.send(JSON.stringify({
                        path: 'setId',
                        data: {
                            id: 1
                        }
                    }));

                    break;

                case 1:
                    expect(data).toBe('Ok');

                    con.send(JSON.stringify({
                        path: 'testCommunication',
                        data: {
                            toId: 2,
                            message: 'Hi!'
                        }
                    }));

                    break;

                case 2:
                    expect(data).toBe('Hello!');
                    con.close();

                    done();
                    break;
            }

            con1Counter++;
        };

        let con2Counter = 0;
        con2.onmessage = ({ data }) => {
            switch (con2Counter) {
                case 0:
                    con2.send(JSON.stringify({
                        path: 'setId',
                        data: {
                            id: 2
                        }
                    }));

                    break;

                case 1:
                    expect(data).toBe('Ok');
                    break;

                case 2:
                    con2.send(JSON.stringify({
                        path: 'testCommunication',
                        data: {
                            toId: 1,
                            message: 'Hello!'
                        }
                    }));

                    con2.close();
            }

            con2Counter++;
        };
    });
});

afterAll(() => {
    socketServer?.close();

    unsafeSocket?.close();
});
