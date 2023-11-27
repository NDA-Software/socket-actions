# onMessage (socket: WebSocket, messageObject: messageObject): Promise\<messageObject>

## Description

This event is executed on all message events after proper authentication (or disable of authentication) and before onPrepareData, this is expected to be used if any threatment to the exact data sent from the user is needed.

## Parameters

- socket: The user-identifying open socket.
- messageObject: The message is parsed from JSON to object before entering this event.

### MessageObject

- path: string which defines the action to be executed after this function is concluded. This can be changed.
- data: the information provided by the user to be passed to the action.

## Return

- This event must always return a messageObject, and this object is the one that will be used to define which action to execute and with which parameters.

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

        return { ...messageObject, path };
    }
});

// In this example you can see how it is possible to change the action to be executed based on outside information.
```
