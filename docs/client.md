# Client

## Description

This class uses the web browser's WebSocket to connect to the SocketActions
server and has some extra features to simplify the interaction.

## Constructor

- options: Configuration object.

## Options

- url (Default: "ws://localhost:3000"): Path to server's socket, generally
  starting with "ws://" or "wss://" when using SSL.
- protocols: Accepts a string or string array and can be used to pass protocols
  to the socket server.
- authentication: Accepts "any" data and if supplied, will be sent to the socket
  as soon as the connection is opened to try authenticating. If this variable is
  not set the client will assume authentication is not required and will skip
  the events onAuthResponse|onOpen|onAuthFailure and go directly to onMessage on
  all messages.
- connectionTryLimit (Default: 0): If provided, defines the amount of times the
  client will try to reconnect on a lost connection to the server.
- secondsBetweenRetries (Default: 5): Defines the amount of seconds to wait
  between every server connection retry.

## Event Options

All event options receive a "MessageEvent" object with the actual message
received by the Socket inside the "data" attribute.

These options are added to the constructor together with the options object
above and all have their own documentation file with more details:

- [onAuthResponse](/docs/clientEvents/onAuthResponse.md): Executed when the
  first message is received, expects such message to be a confirmation of
  success or not.
- [onOpen](/docs/clientEvents/onOpen.md): Executed after onAuthResponse runs
  without errors.
- [onAuthFailure](/docs/clientEvents/onAuthFailure.md): Executed when
  onAuthResponse throws an error.
- [onMessage](/docs/clientEvents/onMessage.md): Executed on all message events
  after proper authentication (or disable of authentication).
- [onClose](/docs/clientEvents/onClose.md): Executed when the connection is
  closed by the server.

### Public Attributes

- authentication (Readonly any): This will keep the authentication provided in
  the constructor for later check if necessary.
- isAuthenticated (Readonly boolean): This changes to true after onAuthResponse
  runs with no errors.
- socket (Readonly WebSocket): This allows you to access the WebSocket client
  directly if required. This should be avoided unless you know what you are
  doing as it can interfere with the proper usage of the Client class.

### Public Methods

- tryAuth (authentcation?: any): This method can be called any time when the
  client wants to authenticate again, the authentication can be updated by
  passing the new one as a parameter. This method fails if the client is already
  authenticated.
- sendAction (path: string, data?: Record\<string, any>): This method calls an
  action with the path given, a data object can be sent with the action as
  parameter to the action.
- sendRequest (path: string, data?: Record\<string, any>): This method does the
  same as sendAction except that this method expects there to be a direct
  response and thus can be awated as if it was an http request. For such a
  response to be made it is required that the Action inside the SocketActions'
  server use the callback "respond".
- reconnect: This method can be called to force the client to try to reconnect
  to the server.

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
