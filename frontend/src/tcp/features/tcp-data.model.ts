export enum TcpDataType {
  SEND = 'send',
  RECEIVE = 'receive',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export interface TcpData {
  connectionId: string;
  data: string;
  timestamp: Date;
  type: TcpDataType;
}