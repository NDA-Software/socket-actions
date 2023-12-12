# onConnection (socket: ClientSocket, req: IncomingMessage): Promise\<void>

## Description

This event is executed when connection from client is stablished.

## Parameters

- clientSocket: The user-identifying open socket.
- req: Data from the socket opening request.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

let count = 0;

new Socket({
    onConnection: () => {
        count++;

        console.log(`Counter: ${count}`);
    }
});

// This will log the amount of times a connection was established.
```
