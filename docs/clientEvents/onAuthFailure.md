# onAuthFailure (message: MessageEvent): Promise\<void>

## Description

This event is executed after the onAuthResponse event throws an error. This can be used to consider the login a failure and/or request to try the login again.

## Parameters

- message: The object received from the socket server that contains the data sent inside.

## Usage:

```
// Assuming the existence of Socket class running on ws://localhost:3000

import Client from "socket-actions/client";

let loginTries = 0;

const client = new Client("ws://localhost:3000", {
    auth: '41',
    onAuthFailure: () => {
        loginTries++;

        if (loginTries > 5)
            throw new Error("Time to give up. :(");

        setTimeout(() => {
            client.tryAuth();
        }, 1000);
    }
});

// Assuming '41' is not a valid authentication for the server, in this example the event will call for another try on authenticating after 5 seconds and then after 5 tries simply give up.
```
