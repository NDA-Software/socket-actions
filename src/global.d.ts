import { type WebSocket } from 'ws';

declare global {
 type DataType = Record<string, any>;

 type MessageObject = {
     path: string,
     data: DataType
 };

 type ActionParameters = {
     data: DataType,
     userData: DataType,
     socket: ClientSocket
 }

 type ClientSocket = WebSocket & {
     userData: DataType
 };
}
