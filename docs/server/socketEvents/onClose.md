# onClose (socket: WebSocket): Promise\<void>

## Description

This event is executed when client closes connection.

## Parameters

- socket: The user-identifying open socket.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

let count = 0;

new Socket({
    onClose: () => {
        count++;

        console.log(`Counter: ${count}`);
    }
});

// In this example the server will log every time a socket disconnects.
```
