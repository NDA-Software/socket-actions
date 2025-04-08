# onOpen (message: MessageEvent): Promise\<void> | void

## Description

This event is executed after the onAuthResponse event runs without errors or as
soon as the connection is opened if authentication is not enabled. This can be
used as a signal to start using the client to sending messages.

## Parameters

- message: The object received from the socket server that contains the data
  sent inside.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000

import Client from "socket-actions/client";

const client = new Client("ws://localhost:3000", {
    auth: '42',
    onOpen: () => {
        client.sendAction("hello", { target: 'World' });
    }
});

// Assuming '42' is a valid authentication for the server, the server in this example will run the action called "hello" giving it { target: 'World' } as a parameter.
```
