# Socket

## Description

This class extends WebSocket.Server and adds wrappers to some of the relevant WebSocket.Server's events adding routing to the action classes.

## Constructor

- options: Configuration object.

## Options

- serverOptions: This is a passthrough object that accepts the same options as the constructor of WebSocket.Server and therefore is mostly unchanged. Except that if no "server" option is added to this object, an express instance will be run and added to this. Therefore this is not required to be set for the socket to run.
- url (Default: "http://localhost"): Url in which the express server and socket will be run.
- port (Default: 3000): Port in which the express server and socket will be run.
- actionsPath (Default: "./actions"): String of the path in which actions will be dynamically imported. In this folder it is expected that all files use "module.exports = " for exporting a class that extends Action class.
- disableAuthentication (Default: false): If set to true, this option will prevent onAuth to be executed, making the first message go directly to onMessage.

## Event Options

These options are added to the constructor together with the options object above and all have their own documentation file with more details:

- [onConnection](/docs/server/socketEvents/onConnection.md): Executed when connection from client is stablished.
- [onAuth](/docs/server/socketEvents/onAuth.md): Executed on the first message to prevent execution of actions before proper authentication.
- [onClose](/docs/server/socketEvents/onClose.md): Executed when client closes connection.
- [onError](/docs/server/socketEvents/onError.md): Executed when an unthreated exception is thrown inside any action or event.
- [onMessage](/docs/server/socketEvents/onMessage.md): Executed on all message events after proper authentication (or disable of authentication) and before onPrepareData, this is expected to be used if any threatment to the exact data sent from the user is needed.
- [onPrepareData](/docs/server/socketEvents/onPrepareData.md): Executed after the onMessage event and before the action in itself. Expected to be used to make modifications to the parameters sent to the action, possibly adding user-specific information to it.

### Public Attributes

- server (Readonly): This will keep the http server used. If not provided within ServerOptions, this will store the Express instance created.

### Public Methods

- close: This closes both the socket and the http server.

## Usage:

```
// Assuming the existence of a "./actions" folder.

import { Socket } from "socket-actions/server";

new Socket();

// Express listening at http://localhost:3000
// SocketActions listening at ws://localhost:3000
```
