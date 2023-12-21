import { type WebSocket } from 'ws';

declare global {
 type DataType = Record<string, any>;

 type MessageObject = {
     path: string,
     data: DataType
 };

 type ClientSocket = WebSocket & {
     userData: DataType
 };

 type ActionParameters = {
     socket: ClientSocket
     userData: DataType,
     data: DataType,
 }
}
