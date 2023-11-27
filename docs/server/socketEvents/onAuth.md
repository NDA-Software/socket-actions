# onAuth (socket: WebSocket, message: string): Promise\<void>

## Description

This event is executed on the first message to prevent execution of actions before proper authentication. If this event throws an exception, the next client message will also be parsed by this event instead of calling an action in itself.

## Constructor

- socket: The user-identifying open socket.
- message: Message sent from the client with data expected to be used for authentication.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

new Socket({
    onAuth: (socket, message) => {
        if (message !== "42)
            throw new Error("You are not our guy.");

        socket.send("Go on.");
    }
});

// This will prevent anyone that hasn't sent a message with "42" from going forward and calling actions.
```
