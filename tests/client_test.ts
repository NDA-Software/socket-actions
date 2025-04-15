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

const onClose = (): void => {
  connectionCounter--;
};

const onError: onErrorType = (socket, err) => {
  socket.send(err.message);
};

const clients: Client[] = [];
Deno.test("Client:", async (t) => {
  const safeSocket = new Socket({
    actions,
    onConnection,
    onAuth,
    onClose,
    onError,
  });

  await safeSocket.start();

  await t.step("Testing isConnected...", () => {
    return new Promise((resolve) => {
      const client = new Client({
        onOpen: () => {
          assertEquals(client.isConnected, true);

          client.sendAction("hello", { name: "World" });
        },
        onMessage: async () => {
          assertEquals(client.isConnected, true);

          await client.close();

          assertEquals(client.isConnected, false);

          await client.close();

          resolve();
        },
        connectionTryLimit: 0,
      });

      clients.push(client);
    });
  });

  await t.step("Testing isAuthenticated...", async () => {
    const promises: Promise<void>[] = [];

    // Expected to fail, and to fail again and then succeed.
    promises.push(
      new Promise((resolve, reject) => {
        let firstTime = true;

        const client = new Client({
          onOpen: () => {
            try {
              if (firstTime) {
                assertEquals(client.isAuthenticated, false);

                client.tryAuth();

                firstTime = false;

                return;
              }

              assertEquals(client.isAuthenticated, true);

              client.close();
              resolve();
            } catch (error) {
              console.error(error);

              reject(error);
            }
          },
          onAuthFailure: () => {
            try {
              assertEquals(client.isAuthenticated, false);

              client.tryAuth("trustMe!");
            } catch (error) {
              console.error(error);

              reject(error);
            }
          },
          connectionTryLimit: 0,
        });

        clients.push(client);
      }),
    );

    // Expected to succeed on first try.
    promises.push(
      new Promise((resolve) => {
        const client = new Client({
          onOpen: () => {
            client.sendAction("hello", { name: "World" });
          },
          onMessage: () => {
            assertEquals(client.isAuthenticated, true);

            resolve();

            client.close();
          },
          authentication: "trustMe!",
          connectionTryLimit: 0,
        });

        clients.push(client);
      }),
    );

    await Promise.all(promises);
  });

  await t.step("Testing onAuthResponse...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onAuthResponse: (message) => {
          try {
            assertEquals(client.isAuthenticated, false); // This runs before the variable is set therefore it is supposed to be false.
            assertEquals(message.data, "Authenticated");

            client.close();
            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      });

      clients.push(client);
    });
  });

  await t.step("Testing onAuthFailure...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onAuthFailure: (message) => {
          try {
            assertEquals(client.isAuthenticated, false);
            assertEquals(message.data, "Failed Authentication");

            client.close();
            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "wrongPassword",
      });
    });
  });

  await t.step("Testing onMessage...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onOpen: () => {
          assertEquals(client.isAuthenticated, true);

          client.sendAction("hello", { name: "World" });
        },
        onMessage: (message) => {
          try {
            assertEquals(client.isAuthenticated, true);

            const { data } = JSON.parse(message.data);

            assertEquals(data.message, "Hello World!");

            client.close();
            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      });

      clients.push(client);
    });
  });

  await t.step("Testing onClose...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onOpen: () => {
          client.close();
        },
        onClose: () => {
          try {
            assertEquals(client.isConnected, false);
            assertEquals(client.isAuthenticated, false);

            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      });

      clients.push(client);
    });
  });

  await t.step("Testing sendAction...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onOpen: () => {
          try {
            client.sendAction("hello", { name: "World" });
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        onMessage: (message) => {
          try {
            const { data } = JSON.parse(message.data);

            assertEquals(data.message, "Hello World!");

            client.close();
            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      });

      clients.push(client);
    });
  });

  await t.step("Testing sendRequest...", () => {
    return new Promise((resolve, reject) => {
      const client = new Client({
        onOpen: async () => {
          try {
            await client.sendRequest("setId", { id: 123 });

            const response = await client.sendRequest("getId");
            assertEquals(response.id, 123);

            client.close();
            resolve();
          } catch (error) {
            console.error(error);

            reject(error);
          }
        },
        connectionTryLimit: 0,
        authentication: "trustMe!",
      });

      clients.push(client);
    });
  });

  outerLoop: while (true) {
    for (const client of clients) {
      if (client.isConnected) {
        sleep(1);

        continue outerLoop;
      }
    }

    break outerLoop;
  }

  await safeSocket.close();
});
