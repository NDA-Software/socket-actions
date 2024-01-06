# onMessage (message: MessageEvent): Promise\<void>

## Description

This event is executed on messages received after authentication or if authentication is disabled. This event should be used to deal with all information received from the server.

## Parameters

- message: The object received from the socket server that contains the data sent inside.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000 that sends the current dateTime every 1 second as a formatted string.

import Client from "socket-actions/client";

let currentDateTime = "01/01/2000 00:00";

const client = new Client("ws://localhost:3000", {
    auth: '42',
    onMessage: (message) => {
        currentDateTime = message.data;

        console.log(currentDateTime);
    }
});

// In this example the client will continually update the variable currentDateTime with its new value every second and print it in the console.
```
