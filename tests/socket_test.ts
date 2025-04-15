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

import FailToHitMonster from "./mockActions/failToHitMonster.ts";
import GetId from "./mockActions/getId.ts";
import Hello from "./mockActions/hello.ts";
import HitMonster from "./mockActions/hitMonster.ts";
import Mistake from "./mockActions/mistake.ts";
import SetId from "./mockActions/setId.ts";
import TestCommunication from "./mockActions/testCommunication.ts";
import TestUserData from "./mockActions/testUserData.ts";

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
    actionsPath: "./mockActions/pathTest",
    disableAuthentication: true,
    serverOptions: {
      port: 3001,
    },
  });

  await unsafeSocket.start();

  const thirdSocket = new Socket({
    actionsPath: "./mockActions/pathTest",
    disableAuthentication: true,
    serverOptions: {
      port: 3002,
    },
  });

  await thirdSocket.start();

  await t.step("Testing onConnection...", async () => {
    await new Promise<void>((resolve, reject) => {
      const client = new Client({
        onOpen: async () => {
          try {
            assertEquals(connectionCounter, 1);

            await client.close();

            resolve();
          } catch (err) {
            reject(err);
          }
        },
        connectionTryLimit: 0,
      });

      clients.push(client);
    });
  });

  await t.step("Testing onAuth...", async () => {
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        let messageCounter = 0;

        const client = new Client({
          authentication: null,
          onOpen: () => {
            client.sendAction("notTrusted");
          },
          onAuthResponse: async (message) => {
            try {
              switch (messageCounter) {
                case 0: // Expected failure of authentication.
                  assertEquals(message.data, "Failed Authentication");

                  // Trying to execute an action without authentication.
                  client.sendAction("hello", { name: "World" });
                  break;
                case 1: // Expected failure of action due to lack of previous authentication.
                  assertEquals(message.data, "Failed Authentication");

                  await client.close();
                  resolve();
                  break;
              }
              messageCounter++;
            } catch (err) {
              reject(err);
            }
          },
          connectionTryLimit: 0,
        });

        clients.push(client);
      }),
      new Promise<void>((resolve, reject) => {
        let messageCounter = 0;

        const client = new Client({
          authentication: "trustMe!",
          onAuthResponse: (message) => {
            try {
              assertEquals(message.data, "Authenticated");

              client.sendAction("hello", { name: "World" });
            } catch (err) {
              reject(err);
            }
          },
          onMessage: async (message) => {
            try {
              switch (messageCounter) {
                case 0: { // Expect action to be executed.
                  const { data } = JSON.parse(message.data as string);

                  assertEquals(data.message, "Hello World!");

                  client.sendAction("getId");
                  break;
                }
                case 1: {
                  const { data } = JSON.parse(message.data as string);
                  assertEquals(uuidValidate(data.id as string), true);

                  await client.close();

                  resolve();
                }
              }
              messageCounter++;
            } catch (err) {
              reject(err);
            }
          },
          connectionTryLimit: 0,
        });

        clients.push(client);
      }),
    ]);
  });

  await t.step("Testing onMessage...", async () => {
    await new Promise<void>((resolve, reject) => {
      let messageCounter = 0;

      const client = new Client({
        authentication: "trustMe!",
        onOpen: () => {
          client.sendAction("hitMonster");
        },
        onMessage: async (message) => {
          try {
            switch (messageCounter) {
              case 0: { // Expect for attack to have failed.
                const { data } = JSON.parse(message.data as string);

                assertEquals(
                  data.message,
                  "You missed! Please wait for the bald guy's help.",
                );

                client.sendAction("hitMonster");
                break;
              }

              case 1: { // Expect action to be executed.
                const { data } = JSON.parse(message.data as string);

                assertEquals(data.message, "ONE PUNCH!");

                await client.close();
                resolve();
                break;
              }
            }

            messageCounter++;
          } catch (err) {
            reject(err);
          }
        },
        connectionTryLimit: 0,
      });

      clients.push(client);
    });
  });

  await t.step("Testing onError...", async () => {
    await new Promise<void>((resolve, reject) => {
      const client = new Client({
        authentication: "trustMe!",
        onOpen: () => {
          client.sendAction("mistake");
        },
        onMessage: async (message) => {
          try {
            assertEquals(message.data, "You were defeated.");

            await client.close();
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      });

      clients.push(client);
    });
  });

  await t.step("Testing onClose...", async () => {
    // This assumes that the onClose function is called when the client closes the connection.
    // If the onClose function is not called, the connectionCounter will not be decremented.

    await sleep(1);

    assertEquals(connectionCounter, 0);
  });

  await t.step("Testing unsafe socket and actionsPath...", async () => {
    await new Promise<void>((resolve, reject) => {
      const client = new Client({
        url: "ws://localhost:3001",
        onOpen: () => {
          client.sendAction("hello");
        },
        onMessage: (message) => {
          try {
            const { data } = JSON.parse(message.data as string);

            assertEquals(data.message, "Hello from dynamic import!");

            client.close();
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        connectionTryLimit: 0,
      });

      clients.push(client);
    });
  });

  await t.step(
    "Testing messaging between clients through actions...",
    async () => {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          let messageCounter = 0;

          const client = new Client({
            authentication: "trustMe!",
            onOpen: () => {
              client.sendAction("setId", {
                id: 1,
              });
            },
            onMessage: (message) => {
              try {
                switch (messageCounter) {
                  case 0: {
                    const { data } = JSON.parse(message.data as string);

                    assertEquals(data.message, "Ok");

                    client.sendAction("testCommunication", {
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

                    client.close();
                    resolve();
                    break;
                }

                messageCounter++;
              } catch (err) {
                reject(err);
              }
            },
          });

          clients.push(client);
        }),
        new Promise<void>((resolve, reject) => {
          let messageCounter = 0;

          const client = new Client({
            authentication: "trustMe!",
            onOpen: () => {
              client.sendAction("setId", {
                id: 2,
              });
            },
            onMessage: (message) => {
              try {
                switch (messageCounter) {
                  case 0: {
                    const { data } = JSON.parse(message.data as string);
                    assertEquals(data.message, "Ok");
                    break;
                  }

                  case 1: {
                    assertEquals(message.data, "Hi!");

                    client.sendAction("testCommunication", {
                      toId: 1,
                      message: "Hello!",
                    });

                    client.sendAction("testUserData");
                    break;
                  }

                  case 2: {
                    const { data } = JSON.parse(message.data as string);

                    assertEquals(data.message, "User Id: 2");

                    client.close();
                    resolve();
                    break;
                  }
                }

                messageCounter++;
              } catch (err) {
                reject(err);
              }
            },
          });

          clients.push(client);
        }),
      ]);
    },
  );

  await t.step("Testing restart...", async () => {
    let bothConnected = false;

    await new Promise<void>((resolve) => {
      const client = new Client({
        url: "ws://localhost:3002",
        onOpen: async () => {
          await thirdSocket?.restart();

          const newClient = new Client({
            url: "ws://localhost:3002",
            onOpen: () => {
              bothConnected = true;

              newClient.close();
              resolve();
            },
            connectionTryLimit: 0,
          });

          clients.push(
            newClient,
          );

          client.close();
        },
        connectionTryLimit: 0,
      });

      clients.push(client);
    });

    assertEquals(bothConnected, true);
  });

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
