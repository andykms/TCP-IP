import { type TcpServerClientStatus } from '../../tcp-server/features/tcp-server-client.model';

export type TcpServerConnectionInfo = {
  connectionId: string;
  serverId: string;
  clientId: string;
  ip: string;
  port: number;
  serverPort: number;
  status: TcpServerClientStatus;
};
