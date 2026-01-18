/* eslint-disable no-var */
import { Server, Socket } from "socket.io";

declare global {
  var io: Server;
  var socket: Socket;
  var user: any;
}

export {};
