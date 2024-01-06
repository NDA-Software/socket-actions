# Client

## Description

This class extends WebSocket and adds wrappers to some of the relevant WebSocket's events adding automatic authentication and other extra features.

## Constructor

- options: Configuration object.

## Options

- url (Default: "ws://localhost:3000"): Path to server's socket, generally starting with "ws://" or "wss://" when using SSL.
- protocols: Accepts a string or string array and can be used to pass protocols to the socket server.
- authentication: Accepts "any" data and if supplied, will be sent to the socket as soon as the connection is opened to try authenticating. If this variable is not set the client will assume authentication is not required and will skip the events onAuthResponse|onOpen|onAuthFailure and go directly to onMessage on all messages.

## Event Options

All event options receive a "MessageEvent" object with the actual message received by the Socket inside the "data" attribute.

These options are added to the constructor together with the options object above and all have their own documentation file with more details:

- [onAuthResponse](/docs/clientEvents/onAuthResponse.md): Executed when the first message is received, expects such message to be a confirmation of success or not.
- [onOpen](/docs/clientEvents/onOpen.md): Executed after onAuthResponse runs without errors.
- [onAuthFailure](/docs/clientEvents/onAuthFailure.md): Executed when onAuthResponse throws an error.
- [onMessage](/docs/clientEvents/onMessage.md): Executed on all message events after proper authentication (or disable of authentication).

### Public Attributes

- authentication (Readonly any): This will keep the authentication provided in the constructor for later check if necessary.
- isAuthenticated (Readonly boolean): This changes to true after onAuthResponse runs with no errors.

### Public Methods

- tryAuth (authentcation?: any): This method can be called any time when the client wants to authenticate again, the authentication can be updated by passing the new one as a parameter. This method fails if the client is already authenticated.
- sendAction (path: string, data?: Record\<string, any>): This method calls an action with the path given, a data object can be sent with the action as parameter to the action.

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
