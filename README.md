# Socket Actions

## Description

This is still a work in progress. The objective is to create an easy to use with little to no configuration WebSocket package (running on top of [ws](https://www.npmjs.com/package/ws)) to run with an object oriented structure to allow routing of WebSocket messages.

## Server Classes

- [Socket](/docs/server/socket.md): The main class that is used to instantiate the server allowing connection through websocket protocols.

## Roadmap:

- 0.3.0:

  - Review usage and add both tests and documentation to action class.

- 0.4.0:

  - Add option to import the Actions on your own and suplying them instead of giving the path to actions and the socket using require.

- 0.5.0:

  - Isolate common types in typing file.
  - Document common types.

- 1.0.0:

  - Create client class to ease integration and avoid the need to use "ws" client to consume the server.
  - Add tests and documentation to client class.
  - Update previous tests to all use the client class instead of default WebSocket client.
  - Update this documentation with all missing informations.

- Before next update:

  - Create simple open-source project using Next.js and Docker to show usage of this package.

- 1.1.0:

  - Add the option for actions to be queued and run in the sequence they are sent instead of asynchronous. This will server for systems that might have a problem with race conditions on the default setting and/or do not have the resources for multiple users' actions to be run at the same time.
  - Add relevant tests.
  - Add relevant documentations.

- 1.2.0:

  - Add the option for a single user to only be able to add a single action to the queue a time, with options to either default to ignore the new action or overwrite the old action.
  - Add relevant tests.
  - Add relevant documentations.

- 1.3.0:

  - Add caching options to avoid multiple similar connections in client object.
  - Update tests.
  - Update documentations.

- Before next update:

  - Create docker image to run this server with little to no configurations

- 1.4.0:
  - Create another parallel entrypoint to be used for local connections between other Docker Containers and similar infraestructures with separate credential style as default.
  - Create ServerActions to be used in such entrypoint. Users should not have access to server actions and server-side clients should not have access to user's actions.
  - Add tests to server-side connections.
  - Add documentation to server-side connections.
