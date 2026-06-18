import { contextBridge, ipcRenderer } from "electron";

enum Format {
  HEX = 'hex',
  ASCII = 'ascii',
  UTF_8 = 'utf-8'
}

export type TcpClientConnection = {
  connectionId: string;
  ip: string;
  port: number;
};

export type TcpDeviceConnection = {
  ip: string;
  port: number;
};

export type TcpServerClient = {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: string;
  bytesReceived: number;
  status: 'connected' | 'disconnected';
};

export type TcpAPI = {
  connect: (connectionId: string, host: string, port: number) => Promise<any>;
  send: (connectionId: string, data: string, format: Format) => Promise<any>;
  sendFile: (connectionId: string, filePath: string) => Promise<any>;
  disconnect: (connectionId: string) => Promise<any>;
  getConnections: () => Promise<TcpClientConnection[]>;
  openFileDialog: () => Promise<{ name: string, path: string , size: number }>;
  searchDevices: () => Promise<TcpDeviceConnection[]>;
  openServer: (serverId: string, port: number) => Promise<{ success: boolean }>;
  closeServer: (serverId: string) => Promise<{ success: boolean }>;
  disconnectServerClient: (serverId: string, clientId: string) => Promise<{ success: boolean }>;
  sendToAllServerClients: (data: string, format: Format) => Promise<{ success: boolean; sentCount: number }>;
  onServerClientsChanged: (callback: (serverId: string, clients: TcpServerClient[]) => void) => void;
  onServerData: (callback: (serverId: string, clientId: string, data: string) => void) => void;
  onData: (callback: (connectionId: string, data: string) => void) => void;
  onError: (callback: (connectionId: string, error: string) => void) => void;
  onClose: (callback: (connectionId: string) => void) => void;
  removeAllListeners: () => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  connect: (connectionId: string, host: string, port: number) => ipcRenderer.invoke('tcp:connect', connectionId, host, port),
  send: (connectionId: string, data: string, format: Format) => ipcRenderer.invoke('tcp:send', connectionId, data, format),
  sendFile: (connectionId: string, filePath: string) => ipcRenderer.invoke('tcp:sendFile', connectionId, filePath),
  disconnect: (connectionId: string) => ipcRenderer.invoke('tcp:disconnect', connectionId),
  getConnections: () => ipcRenderer.invoke('tcp:getConnections'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  searchDevices: () => ipcRenderer.invoke('device-search:search'),
  openServer: (serverId: string, port: number) => ipcRenderer.invoke('tcp-server:open', serverId, port),
  closeServer: (serverId: string) => ipcRenderer.invoke('tcp-server:close', serverId),
  disconnectServerClient: (serverId: string, clientId: string) =>
    ipcRenderer.invoke('tcp-server:disconnect-client', serverId, clientId),
  sendToAllServerClients: (data: string, format: Format) =>
    ipcRenderer.invoke('tcp-server:send-to-all', data, format),

  onServerClientsChanged: (callback: (serverId: string, clients: TcpServerClient[]) => void) =>
    ipcRenderer.on('tcp-server:clients-changed', (_, serverId, clients) => callback(serverId, clients)),
  onServerData: (callback: (serverId: string, clientId: string, data: string) => void) =>
    ipcRenderer.on('tcp-server:data', (_, serverId, clientId, data) => callback(serverId, clientId, data)),

  onData: (callback: (connectionId: string, data: string) => void) => ipcRenderer.on('tcp:data', (_, connectionId, data)=> callback(connectionId, data)),
  onError: (callback: (connectionId: string, error: string) => void) => ipcRenderer.on('tcp:error', (_, connectionId, error) => callback(connectionId, error)),
  onClose: (callback: (connectionId: string) => void) => ipcRenderer.on('tcp:close', (_, connectionId) => callback(connectionId)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('tcp:data');
    ipcRenderer.removeAllListeners('tcp:error');
    ipcRenderer.removeAllListeners('tcp:close');
    ipcRenderer.removeAllListeners('tcp-server:clients-changed');
    ipcRenderer.removeAllListeners('tcp-server:data');
  }
})