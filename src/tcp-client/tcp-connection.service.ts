import { TcpConnection } from "../features/tcp-connection.model";
import * as net from "net";

type DataListener = (data: Buffer) => void;
type ErrorListener = (error: Error) => void;
type CloseListener = (hadError: boolean) => void;

export class TcpConnectionService {
  private socket: net.Socket;
  public id: string;
  private dataListeners: DataListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private closeListeners: CloseListener[] = [];

  constructor(connectionId: string) {
    this.id = connectionId;
    this.socket = new net.Socket();
    this.socket.on("data", (data) => {
      this.dataListeners.forEach((listener) => {
        listener(data);
      })
    })
    this.socket.on("error", (error) => {
      this.errorListeners.forEach((listener) => {
        listener(error);
      })
    })
    this.socket.on("close", (hadError) => {
      this.closeListeners.forEach((listener) => {
        listener(hadError);
      });
      this.disconnect();
    })
    return this;
  }

  connect(port: number, host: string, listener: ()=>void) {
    this.socket.connect(port, host, listener);
  }
  
  addDataListener(listener: (data: Buffer) => void): void {
    this.dataListeners.push(listener)
  }

  addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.push(listener);
  }

  addCloseListener(listener: (hadError: boolean) => void): void {
    this.closeListeners.push(listener);
  }

  disconnect(): void {
    this.socket.destroy();
    this.removeAllListeners();
    console.log("соед.дисконект");
  }

  removeAllListeners(): void {
    this.dataListeners = [];
    this.errorListeners = [];
    this.closeListeners = [];
  }

  get getUnsafedSocket(): net.Socket {
    return this.socket;
  }
}