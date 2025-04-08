# onClose (): Promise\<void> | void

## Description

Executed when the connection is closed by the server.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000

import Client from "socket-actions/client";

let client = new Client("ws://localhost:3000", {
    onClose: () => {
        console.log("The server is probably offline. :(");
    },
    connectionTryLimit: 10
});

// In this example, after 10 tries of reconnecting the client shows the console.log message.
```
