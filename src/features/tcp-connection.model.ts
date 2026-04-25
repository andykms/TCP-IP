import * as net from "net";

export interface TcpConnection {
  socket: net.Socket;
  id: string;
}