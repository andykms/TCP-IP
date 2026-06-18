import * as net from "net";
import {
  TcpServerClientInfo,
  TcpServerClientStatus,
} from "../features/tcp-server-client.model";

type ClientsChangedCallback = (
  serverId: string,
  clients: TcpServerClientInfo[]
) => void;

type DataCallback = (
  serverId: string,
  clientId: string,
  data: Buffer
) => void;

export class TcpServerInstance {
  private server: net.Server | null = null;
  private readonly clients = new Map<string, TcpServerClientInfo>();
  private readonly banned = new Set<string>();
  private readonly sockets = new Map<string, net.Socket>();
  private clientIdCounter = 1;
  public port = 0;

  constructor(
    public readonly serverId: string,
    private readonly onClientsChanged: ClientsChangedCallback,
    private readonly onData?: DataCallback
  ) {}

  open(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error("Система: сервер уже открыт"));
        return;
      }

      this.port = port;
      this.server = net.createServer((socket) => {
        const ip = this.normalizeAddress(socket.remoteAddress ?? "");
        const remotePort = socket.remotePort ?? 0;
        const banKey = `${ip}:${remotePort}`;

        if (this.banned.has(banKey)) {
          socket.destroy();
          return;
        }

        const clientId = this.clientIdCounter.toString();
        this.clientIdCounter++;

        const client: TcpServerClientInfo = {
          clientId,
          ip,
          port: remotePort,
          connectedAt: new Date().toISOString(),
          bytesReceived: 0,
          status: "connected",
        };

        this.clients.set(clientId, client);
        this.sockets.set(clientId, socket);
        this.notifyClientsChanged();

        socket.on("data", (data) => {
          const currentClient = this.clients.get(clientId);
          if (!currentClient || currentClient.status !== "connected") {
            return;
          }

          currentClient.bytesReceived += data.length;
          this.notifyClientsChanged();
          this.onData?.(this.serverId, clientId, data);
        });

        const handleDisconnect = () => {
          const currentClient = this.clients.get(clientId);
          if (!currentClient || currentClient.status !== "connected") {
            return;
          }

          currentClient.status = "disconnected";
          this.sockets.delete(clientId);
          this.notifyClientsChanged();
        };

        socket.on("close", handleDisconnect);
        socket.on("error", handleDisconnect);
      });

      this.server.once("error", (error) => {
        this.server = null;
        this.port = 0;
        reject(error);
      });

      this.server.listen(port, () => resolve());
    });
  }

  disconnectClient(clientId: string): { success: boolean } {
    const client = this.clients.get(clientId);
    const socket = this.sockets.get(clientId);

    if (!client || !socket || client.status !== "connected") {
      return { success: false };
    }

    this.banned.add(`${client.ip}:${client.port}`);
    socket.destroy();
    this.sockets.delete(clientId);
    client.status = "disconnected";
    this.notifyClientsChanged();

    return { success: true };
  }

  close(): void {
    for (const socket of this.sockets.values()) {
      socket.destroy();
    }

    this.sockets.clear();
    this.server?.close();
    this.server = null;
    this.port = 0;

    for (const client of this.clients.values()) {
      if (client.status === "connected") {
        client.status = "disconnected";
      }
    }

    this.notifyClientsChanged();
  }

  getClients(): TcpServerClientInfo[] {
    return Array.from(this.clients.values());
  }

  sendToAllClients(data: string, format: string): number {
    const buffer = Buffer.from(data, format as BufferEncoding);
    let sentCount = 0;

    for (const [clientId, socket] of this.sockets.entries()) {
      const client = this.clients.get(clientId);
      if (!client || client.status !== "connected") {
        continue;
      }

      socket.write(buffer);
      sentCount++;
    }

    return sentCount;
  }

  private notifyClientsChanged(): void {
    this.onClientsChanged(this.serverId, this.getClients());
  }

  private normalizeAddress(address: string): string {
    return address.replace(/^::ffff:/, "");
  }
}
