# Socket Actions

## Description

The objective is to create an easy to use with little to no configuration
WebSocket package (running on top of [ws](https://www.npmjs.com/package/ws)) to
run with an object oriented structure to allow routing of WebSocket messages.

## Peer Dependencies

- [TS-Cornucopia](https://www.npmjs.com/package/ts-cornucopia): Just a quick and
  simple bundle of helper functions.

- [WS](https://www.npmjs.com/package/ws): The basic websocket implementation for
  node servers.

## Classes

- [Socket](/docs/server/socket.md): The main class that is used to instantiate
  the server allowing connection through websocket protocols.
- [Action](/docs/server/action.md): The class that should be extended by all
  actions to be called by the socket instance.
- [Client](/docs/client.md): This class to be used in the client-side to
  communicate with the Socket class' instance.

## Common Types

- DataType: Alias for Record<string, any>.

- MessageObject: Object sent from user as a JSON string message.

  - path (string): Path to action that will be called.
  - data (DataType): Data sent from user.

- ClientSocket: Extension of the type WebSocket from package "ws" adding
  userData attribute.

  - userData (DataType): To hold user-specific data after login and between
    action executions.

- ActionParameters: Parameter object that is sent to action during execution.
  - socket (ClientSocket): User-specific socket for communication.
  - userData (DataType): User-specific data.
  - data (DataType): Data sent from user.

## Example:

- [Checklist](https://github.com/NDA-Software/socket-actions-checklist)

## Roadmap:

- 2.2.0:

  - Add the option for actions to be queued and run in the sequence they are
    sent instead of asynchronous. This will serve for systems that might have a
    problem with race conditions on the default setting and/or do not have the
    resources for multiple users' actions to be run at the same time.

- 2.3.0:

  - Add the option for a single user to only be able to add a single action to
    the queue a time, with options to either default to ignore the new action or
    overwrite the old action.

- 2.4.0:

  - Add caching options to avoid multiple similar connections in client object.

- Before next update:

  - Create docker image to run this server with little to no configurations

- 2.5.0:

  - Create another parallel entrypoint to be used for local connections between
    other Docker Containers and similar infraestructures with separate
    credential style as default.
  - Create ServerActions to be used in such entrypoint. Users should not have
    access to server actions and server-side clients should not have access to
    user's actions.
