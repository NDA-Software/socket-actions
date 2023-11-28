# onPrepareData (socket: WebSocket, data: DataType): Promise\<ActionParameters>

## Description

This event is executed after the onMessage event and before the action in itself. Expected to be used to make modifications to the parameters sent to the action, possibly adding user-specific information to it. If this event is not added, the standard behavior is simply returning the data and socket with an userData empty object.

## Parameters

- socket: The user-identifying open socket.
- data: Data sent from the user.

## Return

- This event must always return an ActionParameters which will be passed to the action.

### ActionParameters

- socket: The socket returned here is the socket that will be passed for the action.
- userData: Simple Record<string,any> object to be used to carry user-related information.
- data: The data from the user can also be modified in this step or simply passed through.

## Usage:

```
// Assuming the existence of a "./actions" folder.
// Assuming function that finds user data in database using the socket.

import { Socket } from "socket-actions/server";

import findUserBySocket from "./madeup"

new Socket({
    onPrepareData: async (socket, data) => {
        const userData = await findUserBySocket(socket);

        return {
            socket,
            userData,
            data
        };
    }
});

// In this example you can see how to add user information to the action's parameters.
```
