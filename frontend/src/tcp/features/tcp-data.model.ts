import { Tcp } from './tcp.model';

export enum TcpDataType {
  SEND = 'send',
  RECEIVE = 'receive',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export interface TcpData extends Tcp {
  connectionId: string;
  data: string;
  timestamp: Date;
  type: TcpDataType;
}
