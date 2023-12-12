# onClose (socket: ClientSocket): Promise\<void>

## Description

This event is executed when client closes connection.

## Parameters

- clientSocket: The user-identifying open socket.

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

// In this example the server will count and log every time a user disconnects.
```
