# Action

## Description

This abstract class serves as a template to be extended for all action classes that will be dynamically called by Socket when needed.

## Main Implementation

- onRun (data: ActionParameters) => Promise<void>: This method must be implemented, in here it is expected to be the logic of the action be executed each time it is ran after all safety and permissions checks are passed.

- server (Socket): This attribute stores a reference to the Socket class that is calling it and can be used to access the public methods and attributes of such, mainly for communication between different clientSockets.

### ActionParameters

This is the object given by the Socket class every time the action is called, it contains these attributes:

- data ([DataType](/README.md#common-types)): This object represents the data parsed from the message sent from the user.
- userData ([DataType](/README.md#common-types)): This object expected to be filled during authentication will have all relevant data from the user that sent the message.
  socket: ([ClientSocket](/README.md#common-types)): User identifying socket that can be used to interact with the user that sent the message.

## Optional Overrides

- prepareAction (socket: Socket) => Promise\<void\>: This method is called once during the starting setup of the Socket class and should be used for any starting setup that requires assyncrhonous execution like starting database connections. When overriding, call the parent version to guarantee proper behavior.

- onCheckPermissions (\_parameters: [ActionParameters](/README.md#common-types)) => Promise\<void\>: This method runs before all executions of the method onRun and should be used to check for any permissions the user might or not have to execute the action. Throwing an error will prevent the execution of onRun.

- onError (\_parameters: [ActionParameters](/README.md#common-types), err: unknown) => Promise\<void\>: This method is called whenever any error happens in onCheckPermissions or onRun and should be used for anything related to error threatment.

### Public Methods

- run: This is the method that is called when the action is invoked by the user through the websocket. This will execute both onCheckPermission and onRun in sequence, delegating any exception to onError.

## Usage:

```
// This is an example of a Action implementation:

import { Action, type ActionParameters } from 'socket-actions';

module.exports = class Hello extends Action {
    override async onRun(params: ActionParameters): Promise<void> {
        const { socket, data } = params;

        socket.send(`Hello ${data.name}!`);
    }
};

// When a previously authenticated user sends a message with the content { path: "hello", data: { name: "Tony" } }, they will receive a message written "Hello Tony!".
```
