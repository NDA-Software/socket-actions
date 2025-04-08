# onError (socket: ClientSocket, req: IncomingMessage): Promise\<void> | void

## Description

This event is executed when an unthreated exception is thrown inside any action
or event. Keep in mind that unless the Action class' onError is overrode, all
errors triggered inside an Action will probably already be catched before
triggering this event.

## Parameters

- clientSocket: The user-identifying open socket.
- err: Error object.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

new Socket({
    onMessage: () => {
        throw new Error("Not strong enough.");
    },
    onError: (socket) => {
        socket.send("You lack hatred.");
    }
});

// In this example any message sent will always trigger onError and therefore return a message to the client.
```
