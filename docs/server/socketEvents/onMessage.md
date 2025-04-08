# onMessage (socket: ClientSocket, messageObject: MessageObject): Promise\<void> | void

## Description

This event is executed on all message events after proper authentication (or
disable of authentication) and before the execution of the action, this is
expected to be used if any threatment to the exact data sent from the user is
needed.

## Parameters

- clientSocket: The user-identifying open socket.
- messageObject: The message is parsed from JSON to object before entering this
  event.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

let counter = 0;

new Socket({
    onMessage: (socket, messageObject) => {
        const { path } = messageObject;

        if (path === "punch") {
            counter++;

            switch (counter) {
                case 1:
                case 2:
                    path = "jab";
                    break;

                case 3:
                    path = "straight";

                    counter = 0;
                    break;
            }
        }

        messageObject.path = path;
    }
});

// In this example you can see how it is possible to change the action to be executed based on outside information.
```
