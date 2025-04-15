import Socket, { type onAuth as onAuthType } from "../src/server/socket.ts";
import ShootLightning from "./mockActions/shootLightning.ts";
import Client from "../src/client.ts";
import { assertEquals } from "@std/assert";

Deno.test("Action: ", async (t) => {
  const actions = {
    shootLightning: new ShootLightning(),
  };

  const onAuth: onAuthType = (socket) => {
    socket.userData = {
      swordColor: firstConnection ? "green" : "red",
    };

    firstConnection = false;
  };

  const socketServer = new Socket({
    actions,
    onAuth,
    serverOptions: {
      port: 3010,
    },
  });

  socketServer.start();

  let firstConnection = true;

  await t.step("Testing permissions...", () => {
    return new Promise<void>((resolve, reject) => {
      let con1: Client | null = null;
      let con2: Client | null = null;

      let messageCounter: number = 0;

      const onMessage = ({ data: message }: { data: string }): void => {
        try {
          switch (messageCounter) {
            case 0: // Expecting failure due to permissions in Connection 1
              assertEquals(message, "You cannot do that.");
              con2?.sendAction("shootLightning");
              break;

            case 1: { // Expecting success in Connection 2
              const { data } = JSON.parse(message as string);

              assertEquals(
                data.message,
                "I am firing my lazer! DAAAAAAAAAAAAAAAH!",
              );

              con1?.close();
              con2?.close();
              resolve();
              break;
            }
          }

          messageCounter++;
        } catch (error) {
          con1?.close();
          con2?.close();
          reject(error);
        }
      };

      con1 = new Client({
        url: "ws://localhost:3010",
        authentication: "hey",
        onMessage,
        onOpen: () => {
          con1?.sendAction("shootLightning");
        },
      });

      con2 = new Client({
        url: "ws://localhost:3010",
        authentication: "hey",
        onMessage,
      });
    });
  });

  socketServer?.close();
});
