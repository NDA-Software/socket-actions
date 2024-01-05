# onAuthFailure (socket: ClientSocket, error: Error, message: Buffer): Promise\<void>

## Description

This event is run after onAuth is stopped by an error. If not provided this event will default to sending a message with "Failed Authentication" to the client socket.

## Parameters

- clientSocket: The user-identifying open socket.
- error: The error thrown by onAuth.
- message: Message sent from the client with data expected to be used for authentication.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

new Socket({
    onAuth: (socket, message) => {
        if (message.data !== "42")
            throw new Error("You are not our guy.");
    },
    onAuthFailure: (socket, error, message) => {
        socket.send("That is not the right answer.");
    },
});

// In this situation after the client sends a message different from "42", the client will receive a message with "That is not the right answer.".
```
