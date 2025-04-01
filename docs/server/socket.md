# Socket

## Description

This class uses WebSocket.Server to create an event-driven server.

## Constructor

- options: Configuration object.

## Options

- serverOptions: This is a passthrough object that accepts the same options as
  the constructor of WebSocket.Server and therefore is mostly unchanged. Except
  that if no "server" option is added to this object, an express instance will
  be run and added to this. Therefore this is not required to be set for the
  socket to run. This carries the port and host (previously url in Options) to
  generate the http server.
- actionsPath (Default: "./actions"): String of the path in which actions will
  be dynamically imported. In this folder it is expected that all files use use
  "export default" for exporting a class that extends Action class.
- actions (Default: undefined): Alternative to giving a path to the actions
  folder, you can also import and instantiate the actions and supply them in a
  structure of DataType being the string the path that will be used to call the
  action from the client.
- disableAuthentication (Default: false): If set to true, this option will
  prevent onAuth to be executed, making the first message go directly to
  onMessage.

## Event Options

All event options receive a "socket" object of type ClientSocket that represents
the current active connection to the user that triggered the event.

The ClientSocket object is a child of the WebSocket object from the package "ws"
with an added field called userData of type DataType that can be used to store
any persistent user data and is expected to be initially filled during onAuth.

These options are added to the constructor together with the options object
above and all have their own documentation file with more details:

- [onConnection](/docs/server/socketEvents/onConnection.md): Executed when
  connection from client is stablished.
- [onAuth](/docs/server/socketEvents/onAuth.md): Executed on the first message
  to prevent execution of actions before proper authentication.
- [onAuthFailure](/docs/server/socketEvents/onAuthFailure.md): Executed when
  onAuth ends with error.
- [onAuthSuccess](/docs/server/socketEvents/onAuthSuccess.md): Executed when
  onAuth runs without error.
- [onClose](/docs/server/socketEvents/onClose.md): Executed when client closes
  connection.
- [onError](/docs/server/socketEvents/onError.md): Executed when an unthreated
  exception is thrown inside any action or event.
- [onMessage](/docs/server/socketEvents/onMessage.md): Executed on all message
  events after proper authentication (or disable of authentication) and before
  the execution of the action, this is expected to be used if any threatment to
  the exact data sent from the user is needed.

### Public Attributes

- server (Readonly): This will keep the http server used. If not provided within
  ServerOptions, this will store the Express instance created.
- activeClients: Gets an array of all userData from the active clientSockets.

### Public Methods

- start: This starts the WebSocket with the given configurations given during
  the constructor.
- restart: This closes the webSocket (not the http server) and runs start again.
- closeSocket: This closes only the WebSocket instance without touching the http
  server.
- close: This closes both the socket and the http server.
- sendMessage (socket: ClientSocket, data: DataType | string): Sends data to
  clientSocket passed.
- sendMessageById (id: string, data: DataType): Finds the clientSocket by the id
  in userData and then sends data to it.
- sendMessageToAll (data: DataType, options: sendMessageToAllOptions): Sends
  data to all activeClients. Options:
  - exceptions (string[]): Lists ids that will be filtered out of the active
    clients to send the message.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

const server = new Socket();

server.start();

// Express listening at http://localhost:3000
// SocketActions listening at ws://localhost:3000
```
