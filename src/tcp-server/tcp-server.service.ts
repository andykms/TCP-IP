import { Format } from "../features/format.model";
import { TcpServerClientInfo } from "../features/tcp-server-client.model";
import { TcpServerInstance } from "./tcp-server-instance";

type RendererSender = (channel: string, ...args: unknown[]) => void;

export class TcpServerService {
  private readonly servers = new Map<string, TcpServerInstance>();

  constructor(private readonly sendToRenderer: RendererSender) {}

  async openServer(serverId: string, port: number): Promise<{ success: boolean }> {
    if (this.servers.has(serverId)) {
      this.servers.get(serverId)!.close();
      this.servers.delete(serverId);
    }

    const instance = new TcpServerInstance(
      serverId,
      (id, clients) => {
        this.sendToRenderer("tcp-server:clients-changed", id, clients);
      },
      (id, clientId, data) => {
        this.sendToRenderer(
          "tcp-server:data",
          id,
          clientId,
          data.toString("utf8")
        );
      }
    );

    this.servers.set(serverId, instance);
    await instance.open(port);
    this.sendToRenderer(
      "tcp-server:clients-changed",
      serverId,
      instance.getClients()
    );

    return { success: true };
  }

  closeServer(serverId: string): { success: boolean } {
    const server = this.servers.get(serverId);
    if (!server) {
      return { success: false };
    }

    server.close();
    this.servers.delete(serverId);
    this.sendToRenderer("tcp-server:clients-changed", serverId, []);

    return { success: true };
  }

  disconnectClient(
    serverId: string,
    clientId: string
  ): { success: boolean } {
    const server = this.servers.get(serverId);
    if (!server) {
      return { success: false };
    }

    return server.disconnectClient(clientId);
  }

  sendToAllClients(
    data: string,
    format: Format = Format.UTF_8
  ): { success: boolean; sentCount: number } {
    let sentCount = 0;

    for (const server of this.servers.values()) {
      sentCount += server.sendToAllClients(data, format);
    }

    return { success: sentCount > 0, sentCount };
  }
}
