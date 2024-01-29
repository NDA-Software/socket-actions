# onClose (): Promise\<void>

## Description

Executed when the connection is closed by the server.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000

import Client from "socket-actions/client";

let client;

const connect = () => {
    client = new Client("ws://localhost:3000", {
        onClose: () => {
            setTimeout(connect, 5000);
        }
    });
}

// In this example, when the connection is closed by the server, the client will wait for 5 seconds and try to connect again.
```
