declare global {
  type Buffer = typeof import("node:buffer").Buffer;
}

import { validate as uuidValidate } from "npm:uuid";
import { assertEquals } from "jsr:@std/assert";
import sleep from "../src/helpers/sleep.ts";

import Socket, {
  type onAuth as onAuthType,
  type onError as onErrorType,
  type onMessage as onMessageType,
} from "../src/server/socket.ts";

import Client from "../src/client.ts";

import FailToHitMonster from "../mockActions/failToHitMonster.ts";
import GetId from "../mockActions/getId.ts";
import Hello from "../mockActions/hello.ts";
import HitMonster from "../mockActions/hitMonster.ts";
import Mistake from "../mockActions/mistake.ts";
import SetId from "../mockActions/setId.ts";
import TestCommunication from "../mockActions/testCommunication.ts";
import TestUserData from "../mockActions/testUserData.ts";

const actions = {
  failToHitMonster: new FailToHitMonster(),
  getId: new GetId(),
  hello: new Hello(),
  hitMonster: new HitMonster(),
  mistake: new Mistake(),
  setId: new SetId(),
  testCommunication: new TestCommunication(),
  testUserData: new TestUserData(),
};

let connectionCounter = 0;

const onConnection = (): void => {
  connectionCounter++;
};

const onAuth: onAuthType = (_, message) => {
  if (message.toString() !== "trustMe!") {
    throw new Error("Access Denied!");
  }
};

let firstHit = true;
const onMessage: onMessageType = (_socket, messageObject) => {
  if (messageObject.path === "hitMonster" && firstHit) {
    messageObject.path = "failToHitMonster";

    firstHit = false;
  }
};

const onClose = (): void => {
  connectionCounter--;
};

const onError: onErrorType = (socket, err) => {
  socket.send(err.message);
};

const clients: Client[] = [];
Deno.test("Socket Server:", async (t) => {
  const safeSocket = new Socket({
    actions,
    onConnection,
    onAuth,
    onMessage,
    onClose,
    onError,
  });

  await safeSocket.start();

  const unsafeSocket = new Socket({
    actionsPath: "../mockActions/pathTest",
    disableAuthentication: true,
    serverOptions: {
      port: 3001,
    },
  });

  await unsafeSocket.start();

  const thirdSocket = new Socket({
    actionsPath: "../mockActions/pathTest",
    disableAuthentication: true,
    serverOptions: {
      port: 3002,
    },
  });

  await thirdSocket.start();

  await t.step("Testing onConnection...", async () => {
    clients.push(
      new Client({
        onOpen: () => {
          assertEquals(connectionCounter, 1);

          clients[0].close();
        },
        connectionTryLimit: 0,
      }),
    );

    await sleep(100);
  });

  await t.step("Testing onAuth...", async () => {
    let messageCounter0: number = 0;

    // Client expected to fail
    clients.push(
      new Client({
        authentication: null,
        onOpen: () => {
          clients[1].sendAction("notTrusted");
        },
        onAuthResponse: (message) => {
          switch (messageCounter0) {
            case 0: // Expected failure of authentication.
              assertEquals(message.data, "Failed Authentication");

              // Trying to execute an action without authentication.
              clients[1].sendAction("hello", { name: "World" });
              break;

            case 1: // Expected failure of action due to lack of previous authentication.
              assertEquals(message.data, "Failed Authentication");

              clients[1].close();
              break;
          }

          messageCounter0++;
        },
        connectionTryLimit: 0,
      }),
    );

    // Client expected to succeed
    let messageCounter1: number = 0;
    clients.push(
      new Client({
        onAuthResponse: (message: { data: string }) => {
          assertEquals(message.data, "Authenticated");

          clients[2].sendAction("hello", { name: "World" });
        },
        onMessage: (message: { data: string }) => {
          switch (messageCounter1) {
            case 0: { // Expect action to be executed.
              const { data } = JSON.parse(message.data as string);

              assertEquals(data.message, "Hello World!");

              clients[2].sendAction("getId");
              break;
            }

            case 1: {
              const { data } = JSON.parse(message.data as string);

              assertEquals(uuidValidate(data.id as string), true);

              clients[2].close();
              break;
            }
          }

          messageCounter1++;
        },
        authentication: "trustMe!",
        connectionTryLimit: 0,
      }),
    );

    await sleep(100);
  });

  await t.step("Testing onMessage...", async () => {
    let messageCounter: number = 0;

    clients.push(
      new Client({
        onOpen: () => {
          clients[3].sendAction("hitMonster");
        },
        onMessage: (message) => {
          switch (messageCounter) {
            case 0: { // Expect for attack to have failed.
              const { data } = JSON.parse(message.data as string);

              assertEquals(
                data.message,
                "You missed! Please wait for the bald guy's help.",
              );

              clients[3].sendAction("hitMonster");
              break;
            }

            case 1: { // Expect action to be executed.
              const { data } = JSON.parse(message.data as string);

              assertEquals(data.message, "ONE PUNCH!");

              clients[3].close();
              break;
            }
          }

          messageCounter++;
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      }),
    );

    await sleep(100);
  });

  await t.step("Testing onError...", async () => {
    clients.push(
      new Client({
        authentication: "trustMe!",
        onOpen: () => {
          clients[4].sendAction("mistake");
        },
        onMessage: (message) => {
          assertEquals(message.data, "You were defeated.");

          clients[4].close();
        },
      }),
    );

    await sleep(100);
  });

  await t.step("Testing onClose...", async () => {
    // This assumes that the onClose function is called when the client closes the connection.
    // If the onClose function is not called, the connectionCounter will not be decremented.

    await sleep(100);

    assertEquals(connectionCounter, 0);
  });

  await t.step("Testing unsafe socket and actionsPath...", async () => {
    clients.push(
      new Client({
        url: "ws://localhost:3001",
        onOpen: () => clients[5].sendAction("hello"),
        onMessage: (message) => {
          const { data } = JSON.parse(message.data as string);

          assertEquals(data.message, "Hello from dynamic import!");

          clients[5].close();
        },
        connectionTryLimit: 0,
      }),
    );

    await sleep(100);
  });

  await t.step(
    "Testing messaging between clients through actions...",
    async () => {
      let con1Counter = 0;
      clients.push(
        new Client({
          authentication: "trustMe!",
          onOpen: () => {
            clients[6].sendAction("setId", {
              id: 1,
            });
          },
          onMessage: (message) => {
            switch (con1Counter) {
              case 0: {
                const { data } = JSON.parse(message.data as string);

                assertEquals(data.message, "Ok");

                clients[6].sendAction("testCommunication", {
                  toId: 2,
                  message: "Hi!",
                });
                break;
              }

              case 1:
                assertEquals(
                  message.data,
                  "Hello!",
                );

                clients[6].close();
                break;
            }

            con1Counter++;
          },
        }),
      );

      let con2Counter = 0;
      clients.push(
        new Client({
          authentication: "trustMe!",
          onOpen: () => {
            clients[7].sendAction("setId", {
              id: 2,
            });
          },
          onMessage: (message) => {
            switch (con2Counter) {
              case 0: {
                const { data } = JSON.parse(message.data as string);
                assertEquals(data.message, "Ok");
                break;
              }

              case 1: {
                assertEquals(message.data, "Hi!");

                clients[6].sendAction("testCommunication", {
                  toId: 1,
                  message: "Hello!",
                });

                clients[7].sendAction("testUserData");
                break;
              }

              case 2: {
                const { data } = JSON.parse(message.data as string);

                assertEquals(data.message, "User Id: 2");

                clients[7].close();
                break;
              }
            }

            con2Counter++;
          },
        }),
      );

      await sleep(100);
    },
  );

  await t.step("Testing restart...", async () => {
    let bothConnected = false;

    clients.push(
      new Client({
        url: "ws://localhost:3002",
        onOpen: async () => {
          clients[8].close();

          await thirdSocket?.restart();

          clients.push(
            new Client({
              url: "ws://localhost:3002",
              onOpen: () => {
                bothConnected = true;

                clients[9].close();
              },
              connectionTryLimit: 0,
            }),
          );
        },
        connectionTryLimit: 0,
      }),
    );

    await sleep(100);

    assertEquals(bothConnected, true);
  });

  await sleep(1000);

  outerLoop: while (true) {
    for (const client of clients) {
      if (client.isConnected) {
        client.close();

        sleep(1);

        continue outerLoop;
      }
    }

    break outerLoop;
  }

  await safeSocket.close();
  await unsafeSocket.close();
  await thirdSocket.close();
});
