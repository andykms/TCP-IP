export type TcpServerClientStatus = 'connected' | 'disconnected';

export interface TcpServerClient {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: string;
  bytesReceived: number;
  status: TcpServerClientStatus;
}

export type TcpServerStatus = 'loading' | 'opened' | 'error' | null;
