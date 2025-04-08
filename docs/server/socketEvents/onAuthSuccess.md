# onAuthSuccess (socket: ClientSocket, message: Buffer): Promise\<void> | void

## Description

This event is run after onAuth is run without errors. If not provided this event
will default to sending a message with "Authenticated" to the client socket.

## Parameters

- clientSocket: The user-identifying open socket.
- message: Message sent from the client with data expected to be used for
  authentication.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

new Socket({
    onAuth: (socket, message) => {
        if (message.data !== "42")
            throw new Error("You are not our guy.");
    },
    onAuthSuccess: (socket, message) => {
        socket.send("Go on.");
    },
});

// In this situation after the client sends a message with "42", the client will receive a message with "Go on".
```
