import { Format } from "../features/format.model";
import { TcpClientConnection } from "../features/tcp-client-connection.model";
import { TcpConnectionService } from "./tcp-connection.service";
import * as fs from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";

export class TcpClientService {
  private readonly connections: Map<string, TcpConnectionService> = new Map();

  private readonly CONNECTION_TIMEOUT = 10000;

  constructor() {}

  connect(
    connectionId: string,
    host: string,
    port: number
  ): Promise<TcpConnectionService> {
    return new Promise((resolve, reject) => {
      if (this.connections.has(connectionId)) {
        this.connections.get(connectionId)!.disconnect();
      }

      const newConnection = new TcpConnectionService(connectionId);

      this.connections.set(connectionId, newConnection);

      const timeout = setTimeout(() => {
        newConnection.disconnect();
        reject(new Error("Система: время подключения истекло"));
      }, this.CONNECTION_TIMEOUT);

      newConnection.addCloseListener(() => {
        this.connections.delete(connectionId);
        console.log("удал.соед.откл");
        console.log(this.connections.keys());
      });

      newConnection.addErrorListener((err) => {
        this.connections.delete(connectionId);
        console.log("удал.соед.ошиб");
        console.log(this.connections.keys());
      });

      newConnection.connect(port, host, () => {
        clearTimeout(timeout);
        return resolve(newConnection);
      });
    });
  }

  disconnect(connectionId: string) {
    if (this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId)!;
      // Important: remove from Map immediately. TcpConnectionService.disconnect()
      // clears listeners before the socket 'close' event fires, so relying on
      // close listeners to delete from this Map is not safe.
      this.connections.delete(connectionId);
      connection.disconnect();
      return { success: true };
    }
  }

  getConnections(): TcpClientConnection[] {
    return Array.from(this.connections.entries()).map(
      ([connectionId, connection]) => ({
        connectionId,
        ip: connection.host,
        port: connection.port,
      })
    );
  }

  async sendData(
    connectionId: string,
    data: string,
    format: Format = Format.UTF_8
  ) {
    const connection = this.connections.get(connectionId);

    const buffer = Buffer.from(data, format);

    if (!connection) {
      return Promise.reject(new Error("Система: подключение не найдено"));
    }
    const successfully = connection.getUnsafedSocket.write(buffer);
    if (successfully) return Promise.resolve({ success: true });
    else throw new Error("Система: ошибка отправки данных");
  }

  async sendFile(connectionId: string, filePath: string) {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return Promise.reject(new Error("Система: подключение не найдено"));
    }

    try {
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath);
      const fileSize = stats.size;

      const header = JSON.stringify({
        type: "file",
        name: fileName,
        size: fileSize,
      });

      connection.getUnsafedSocket.write(header);
      const readStream = fs.createReadStream(filePath);
      await pipeline(readStream, connection.getUnsafedSocket, { end: false });
      return Promise.resolve({ success: true, fileName, fileSize });
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
