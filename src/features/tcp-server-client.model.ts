export type TcpServerClientStatus = "connected" | "disconnected";

export interface TcpServerClientInfo {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: string;
  bytesReceived: number;
  status: TcpServerClientStatus;
}
