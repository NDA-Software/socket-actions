# onAuthResponse (message: MessageEvent): Promise\<void>

## Description

This event is executed on the first message received and expects it to be a response to its authentication attempt. If this event throws an exception, the event onAuthFailure will be triggered. To run through authentication again, you have to call the public method tryAuth after or inside the failure event.

If this event is not provided the client will default to expect the message received to be "Authenticated" and if not it will throw an exception. "Authenticated" is the default response from Socket server if the SocketEvent "onAuthSuccess" is not overwritten.

## Parameters

- message: The object received from the socket server that contains the data sent inside.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000

import Client from "socket-actions/client";

const client = new Client("ws://localhost:3000", {
    auth: '42',
    onAuth: (message) => {
        if (message.data !== '1337')
            throw new Error("The server doesn't like us. :(");
    }
});

// In this example the client will only consider to be logged if the server responds with '1337' to the authentication attempt.
```
