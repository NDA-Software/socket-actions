import { validate as uuidValidate } from 'uuid';

import Socket, {
    type onAuth as onAuthType,
    type onError as onErrorType,
    type onMessage as onMessageType
} from '../src/server/socket';

import { type Action } from '../src';

import FailToHitMonster from '../mockActions/failToHitMonster';
import GetId from '../mockActions/getId';
import Hello from '../mockActions/hello';
import HitMonster from '../mockActions/hitMonster';
import Mistake from '../mockActions/mistake';
import TestUserData from '../mockActions/testUserData';

import Client from '../src/client';

const actions: Record<string, Action> = {
    failToHitMonster: new FailToHitMonster(),
    getId: new GetId(),
    hello: new Hello(),
    hitMonster: new HitMonster(),
    mistake: new Mistake(),
    testUserData: new TestUserData()
};

let unsafeSocket: Socket | null = null;
let socketServer: Socket | null = null;

let connectionCounter = 0;

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
        const con = new Client({
            authentication: 'trustMe!',
            onOpen: async () => {
                expect(connectionCounter).toBe(1);

                con.close();

                done();
            }
        });
    });

    let messageCounter: number = 0;

    test('Testing onAuth...', (done) => {
        const con = new Client({
            authentication: 'notTrusted',
            onAuthFailure: async ({ data: message }: MessageEvent) => {
                switch (messageCounter) {
                    case 0: // Expected failure of authentication.
                        expect(message).toBe('Failed Authentication');

                        con.sendAction('hello', { name: 'World' });
                        break;

                    case 1: // Expected failure of action due to lack of previous authentication.
                        expect(message).toBe('Failed Authentication');

                        con.tryAuth('trustMe!');
                        break;
                }

                messageCounter++;
            },
            onOpen: async () => { // Expect authentication success.
                con.sendAction('hello', { name: 'World' });

                messageCounter++;
            },
            onMessage: async ({ data: message }: MessageEvent) => {
                switch (messageCounter) {
                    case 3: // Expect action to be executed.
                        expect(message).toBe('Hello World!');

                        con.sendAction('getId');
                        break;

                    case 4:
                        expect(
                            uuidValidate(message)
                        ).toBe(true);

                        con.close();
                        done();
                        break;
                }

                messageCounter++;
            }
        });
    });

    test('Testing onMessage...', (done) => {
        let messageCounter: number = 0;

        const con = new Client({
            authentication: 'trustMe!',
            onOpen: async () => {
                con.sendAction('hitMonster');
            },
            onMessage: async ({ data: message }) => {
                switch (messageCounter) {
                    case 0: // Expect for attack to have failed.
                        expect(message).toBe('You missed! Please wait for the bald guy\'s help.');

                        con.sendAction('hitMonster');
                        break;

                    case 1: // Expect action to be executed.
                        expect(message).toBe('ONE PUNCH!');

                        con.close();
                        done();
                        break;
                }

                messageCounter++;
            }
        }
        );
    });

    test('Testing onError...', (done) => {
        const con = new Client({
            authentication: 'trustMe!',
            onOpen: async () => {
                con.sendAction('mistake');
            },
            onMessage: async ({ data: message }) => {
                con.close();

                expect(message).toBe('You were defeated.');

                done();
            }
        });
    });

    test('Testing onClose...', (done) => {
        // This required a timeout since onClose is async and therefore will not be waited when socket is closed.

        setTimeout(() => {
            expect(connectionCounter).toBe(0);

            done();
        }, 20);
    });

    test('Testing unsafe socket and actionsPath...', (done) => {
        const con = new Client({
            url: 'ws://localhost:3001',
            onOpen: async () => {
                con.sendAction('hello');
            },
            onMessage: async ({ data: message }) => {
                expect(message).toBe('Hello from module.exports!');

                con.close();

                done();
            }
        });
    });
});

afterAll(() => {
    socketServer?.close();

    unsafeSocket?.close();
});
